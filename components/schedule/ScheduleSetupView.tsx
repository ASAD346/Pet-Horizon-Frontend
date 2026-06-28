import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { SafeModal } from '@/components/ui/SafeModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing, Palette } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScheduleScreenHeader } from './ScheduleScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useActivePet } from '@/hooks/useActivePet';
import { useNotifications } from '@/hooks/useNotifications';
import { usePetPermissions } from '@/hooks/usePetPermissions';
import { useFocusReload } from '@/hooks/useStaleLoadScope';
import {
  featureOptionsFromRemote,
  hydrateScheduleFeaturesFromSpecies,
  type ScheduleFeatureOptions,
} from '@/lib/schedule/hydrateScheduleFeatures';
import { getSpeciesFeatures } from '@/lib/species/speciesFeatures';
import {
  createFeedingEntry,
  createGroomingEntry,
  createInitialScheduleState,
  createMedicineEntry,
  createVaccinationEntry,
  createWalkEntry,
} from '@/lib/schedule/defaults';
import { deleteScheduleEntry } from '@/lib/schedule/deleteScheduleEntry';
import { loadExistingSchedules } from '@/lib/schedule/loadSchedules';
import { AppConfirmModal } from '@/components/ui/AppConfirmModal';
import {
  getCachedSchedules,
  setCachedSchedules,
} from '@/lib/schedule/scheduleCache';
import {
  scheduleEntryRemoteId,
  scheduleEntrySubtitle,
  scheduleEntryTitle,
} from '@/lib/schedule/mapSchedules';
import type { ScheduleDateState } from '@/lib/schedule/scheduleDate';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';
import type {
  FeedingEntryState,
  GroomingEntryState,
  MedicineEntryState,
  ScheduleSectionKey,
  ScheduleSectionsState,
  VaccinationEntryState,
  WalkEntryState,
} from '@/lib/schedule/types';
import { fetchGroomingTypes } from '@/services/grooming/groomingApi';
import { fetchPetPermissions } from '@/services/schedules/feedingApi';
import { updatePet } from '@/services/pets/petApi';
import { setActivePetCache } from '@/lib/pet/activePetCache';
import type { GroomingTypeOption } from '@/types/grooming';
import { ScheduleSectionCard } from './ScheduleSectionCard';
import { ScheduleEntrySummaryCard } from './ScheduleEntrySummaryCard';
import { LogFoodSheet } from '../log-food/LogFoodSheet';
import { LogWalkSheet } from '../log-walk/LogWalkSheet';
import { LogMedicineSheet } from '../log-medicine/LogMedicineSheet';
import { LogVaccinationSheet } from '../log-vaccination/LogVaccinationSheet';
import { LogGroomingSheet } from '../log-grooming/LogGroomingSheet';
import { SCHEDULE_SECTIONS, type ScheduleSectionTheme } from './scheduleTheme';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { scheduleFieldStyles } from './scheduleStyles';

type EditorEntry =
  | FeedingEntryState
  | WalkEntryState
  | MedicineEntryState
  | VaccinationEntryState
  | GroomingEntryState;

interface EditorState {
  mode: 'add' | 'edit';
  section: ScheduleSectionTheme;
  entry: EditorEntry;
}

interface ScheduleSetupViewProps {
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  /** Called after a successful toggle so the parent can force-reload pet state */
  onPetReload?: () => void;
}

function ScheduleEntriesSkeleton() {
  return (
    <View style={styles.entriesSkeleton}>
      <Skeleton width="100%" height={56} borderRadius={Radius.md} />
      <Skeleton width="100%" height={56} borderRadius={Radius.md} />
    </View>
  );
}

export function ScheduleSetupView({
  onJournalPress,
  onNotificationsPress,
  onPetReload,
}: ScheduleSetupViewProps) {
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token, user } = useAuth();
  const { pet, loading: petLoading } = useActivePet(token);
  const { unreadCount } = useNotifications(token);
  // Stable ref so focusReload closure always reads the latest pet without
  // needing pet as a dependency (which would loop).
  const petRef = useRef(pet);
  petRef.current = pet;
  const queryClient = useQueryClient();
  const { showToast, showErrorToast } = useToast();
  const {
    canViewSchedule,
    canEditSchedule,
    canViewJournal,
    canViewAnySchedule,
    accessBannerMessage,
  } = usePetPermissions(token, pet, user?._id);

  const isPremium = user?.premiumStatus === 'premium';
  const brandColor = isPremium ? Palette.premium.emerald : Palette.success;
  const brandBg = isPremium ? Palette.premium.emeraldLight : Palette.successLight;

  const [sections, setSections] = useState<ScheduleSectionsState>(() => createInitialScheduleState());
  const [mealTypeOptions, setMealTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [groomingTypeOptions, setGroomingTypeOptions] = useState<GroomingTypeOption[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [defaultMeal, setDefaultMeal] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('');
  const [defaultGrooming, setDefaultGrooming] = useState('');
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteInfo, setPendingDeleteInfo] = useState<{
    sectionMeta: ScheduleSectionTheme;
    remoteId: string;
    entry: EditorEntry;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ScheduleSectionKey>('all');
  const [fabMenuVisible, setFabMenuVisible] = useState(false);

  const groomingVisibleRef = useRef(groomingVisible);
  groomingVisibleRef.current = groomingVisible;

  const applyFeatureOptions = useCallback((options: ScheduleFeatureOptions) => {
    setMealTypeOptions(options.mealTypeOptions);
    setUnitOptions(options.unitOptions);
    setGroomingTypeOptions(options.groomingTypeOptions);
    setGroomingVisible(options.groomingVisible);
    setDefaultMeal(options.defaultMeal);
    setDefaultUnit(options.defaultUnit);
    setDefaultGrooming(options.defaultGrooming);
  }, []);

  const reloadSchedules = useCallback(
    async (
      petId: string,
      options?: { silent?: boolean; disabledCategories?: string[] },
    ) => {
      if (!token) return;

      if (!options?.silent) {
        setSchedulesLoading(true);
      }

      try {
        // Always pass disabledCategories so enabled flags survive reload.
        // If not provided, read from the current pet ref.
        const disabled =
          options?.disabledCategories ?? petRef.current?.disabledCategories ?? [];
        const loaded = await loadExistingSchedules(token, petId, {
          groomingVisible: groomingVisibleRef.current,
          disabledCategories: disabled,
        });
        setSections(loaded);
        setCachedSchedules(petId, loaded);
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : 'Unable to load schedules.');
      } finally {
        setSchedulesLoading(false);
      }
    },
    [token],
  );

  const focusReload = useCallback(() => {
    const currentPet = petRef.current;
    if (currentPet?._id) {
      void reloadSchedules(currentPet._id, {
        silent: true,
        disabledCategories: currentPet.disabledCategories ?? [],
      });
    }
  }, [reloadSchedules]);

  useFocusReload(focusReload, Boolean(token && pet?._id));

  useEffect(() => {
    if (!token || !pet?._id || pet._id === 'fallback-pet-id-123') {
      if (!petLoading) {
        setSections(createInitialScheduleState());
        setMealTypeOptions([]);
        setUnitOptions([]);
        setGroomingTypeOptions([]);
      }
      return;
    }

    const petId = pet._id;
    const localOptions = hydrateScheduleFeaturesFromSpecies(pet.species);
    applyFeatureOptions(localOptions);

    const cached = getCachedSchedules(petId);
    if (cached) {
      setSections(cached);
    }

    let cancelled = false;

    void (async () => {
      setSchedulesLoading(!cached);
      try {
        const [permsResult, groomingResult, schedulesResult] = await Promise.allSettled([
          fetchPetPermissions(token, petId),
          fetchGroomingTypes(token, petId),
          loadExistingSchedules(token, petId, {
            groomingVisible: localOptions.groomingVisible,
            disabledCategories: pet?.disabledCategories ?? [],
          }),
        ]);

        if (cancelled) return;

        const localFeatures = getSpeciesFeatures(pet.species);
        let remoteMealTypes = localFeatures.mealTypes;
        let remoteInventoryUnits = localFeatures.inventoryUnits;
        let remoteGroomingVisible = localOptions.groomingVisible;
        let remoteGroomingTypes = localOptions.groomingTypeOptions;

        if (permsResult.status === 'fulfilled' && permsResult.value.speciesFeatures) {
          const remote = permsResult.value.speciesFeatures;
          if (remote.mealTypes?.length) remoteMealTypes = remote.mealTypes;
          if (remote.inventoryUnits?.length) remoteInventoryUnits = remote.inventoryUnits;
          if (typeof remote.groomingVisible === 'boolean') {
            remoteGroomingVisible = remote.groomingVisible;
          }
        }

        if (groomingResult.status === 'fulfilled') {
          if (groomingResult.value.types?.length) {
            remoteGroomingTypes = groomingResult.value.types;
          }
          remoteGroomingVisible = groomingResult.value.groomingVisible;
        }

        applyFeatureOptions(
          featureOptionsFromRemote(pet.species, {
            mealTypes: remoteMealTypes,
            inventoryUnits: remoteInventoryUnits,
            groomingVisible: remoteGroomingVisible,
            groomingTypes: remoteGroomingTypes,
          }),
        );

        if (schedulesResult.status === 'fulfilled') {
          // enabled flags are already correct because we passed disabledCategories
          // into loadExistingSchedules → buildScheduleSectionsState above.
          const loaded = schedulesResult.value;
          setSections(loaded);
          setCachedSchedules(petId, loaded);
        } else if (!cached) {
          showErrorToast('Unable to load saved schedules.');
        }
      } finally {
        if (!cancelled) {
          setSchedulesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, pet?._id, pet?.species, petLoading, applyFeatureOptions, pet?.disabledCategories]);

  const toggleSection = async (key: ScheduleSectionKey, enabled: boolean) => {
    if (!token || !pet?._id) return;

    const currentDisabled = pet.disabledCategories || [];
    let newDisabled = [...currentDisabled];
    if (enabled) {
      newDisabled = newDisabled.filter((c) => c !== key);
    } else {
      if (!newDisabled.includes(key)) {
        newDisabled.push(key);
      }
    }

    // Optimistic UI update — apply toggle immediately
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }));

    try {
      const updatedPet = await updatePet(token, pet._id, { disabledCategories: newDisabled });

      // Update the in-memory + AsyncStorage cache with fresh pet data
      setActivePetCache(token, updatedPet);

      // Force parent to re-read the updated pet from cache so focusReload
      // uses the correct disabledCategories on the next screen visit
      onPetReload?.();

      // Invalidate dashboard so Today's Schedule & counts reflect the change
      queryClient.invalidateQueries({ queryKey: ['dashboard', pet._id] });
    } catch (e) {
      // Rollback optimistic update on failure
      setSections((prev) => ({
        ...prev,
        [key]: { ...prev[key], enabled: !enabled },
      }));
      showToast(e instanceof Error ? e.message : 'Failed to update schedule status.');
    }
  };

  const createEntryForSection = (key: ScheduleSectionKey): EditorEntry => {
    if (key === 'feeding') return createFeedingEntry(defaultMeal, defaultUnit);
    if (key === 'walk') return createWalkEntry();
    if (key === 'medicine') return createMedicineEntry();
    if (key === 'vaccination') return createVaccinationEntry();
    return createGroomingEntry(defaultGrooming);
  };

  const openAddEditor = (sectionMeta: ScheduleSectionTheme) => {
    setEditorError(null);
    setEditor({
      mode: 'add',
      section: sectionMeta,
      entry: createEntryForSection(sectionMeta.key),
    });
  };

  const openEditEditor = (sectionMeta: ScheduleSectionTheme, entry: EditorEntry) => {
    setEditorError(null);
    setEditor({
      mode: 'edit',
      section: sectionMeta,
      entry: { ...entry },
    });
  };

  const closeEditor = () => {
    if (editorSaving) return;
    setEditor(null);
    setEditorError(null);
  };

  const handleEditorSave = async () => {
    if (!editor || !token || !pet?._id || editorSaving) return;

    setEditorSaving(true);
    setEditorError(null);

    try {
      await saveScheduleEntry(token, pet._id, editor.section.key, editor.entry, {
        groomingVisible,
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard', pet._id] });
      setEditor(null);
      const msg = editor.mode === 'add' ? 'Schedule added successfully.' : 'Schedule updated successfully.';
      showToast(msg);
      await reloadSchedules(pet._id);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Unable to save schedule.';
      setEditorError(err);
      showToast(err);
    } finally {
      setEditorSaving(false);
    }
  };

  const confirmDeleteEntry = (sectionMeta: ScheduleSectionTheme, entry: EditorEntry) => {
    const remoteId = scheduleEntryRemoteId(sectionMeta.key, entry);
    console.log('[confirmDeleteEntry] key:', sectionMeta.key, 'remoteId:', remoteId, 'hasToken:', !!token);
    if (!remoteId || !token) {
      console.warn('[confirmDeleteEntry] Aborted. remoteId or token missing.');
      return;
    }

    Alert.alert(
      "Delete Schedule Entry?",
      "Are you sure you want to proceed with this action? This change cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Proceed",
          onPress: async () => {
            await handleDeleteEntry(sectionMeta.key, remoteId, entry);
          }
        }
      ]
    );
  };

  const handleDeleteEntry = async (
    key: ScheduleSectionKey,
    remoteId: string,
    entry: EditorEntry,
  ) => {
    console.log('[handleDeleteEntry] key:', key, 'remoteId:', remoteId, 'petId:', pet?._id, 'deletingId:', deletingId);
    if (!token || !pet?._id || deletingId === remoteId) {
      console.warn('[handleDeleteEntry] Aborted due to missing token/petId or already deleting.');
      return;
    }

    setDeletingId(remoteId);

    // Optimistic UI removal — immediately hide the entry before the API call
    const removedEntryId = entry.id;
    console.log('[handleDeleteEntry] Optimistically removing entry ID:', removedEntryId);
    setSections((prev) => {
      const section = prev[key];
      return {
        ...prev,
        [key]: {
          ...section,
          // Filter by local entry.id (generated client-side UUID, always unique)
          entries: (section.entries as EditorEntry[]).filter((e) => e.id !== removedEntryId),
        },
      };
    });

    try {
      console.log('[handleDeleteEntry] Calling deleteScheduleEntry API...');
      await deleteScheduleEntry(token, key, remoteId);
      console.log('[handleDeleteEntry] API succeeded. Optimistically updating cache, invalidating queries and reloading...');
      
      // Optimistically remove from dashboard todaySchedules & upcomingTasks
      queryClient.setQueryData(['dashboard', pet._id], (prev: any) => {
        if (!prev) return prev;
        const newTodaySchedules = { ...prev.todaySchedules };
        if (newTodaySchedules[key]) {
          newTodaySchedules[key] = newTodaySchedules[key].filter(
            (item: any) => item._id !== remoteId && item.id !== remoteId
          );
        }
        const newUpcomingTasks = (prev.upcomingTasks || []).filter(
          (task: any) => task.id !== remoteId && task._id !== remoteId
        );
        return {
          ...prev,
          todaySchedules: newTodaySchedules,
          upcomingTasks: newUpcomingTasks,
        };
      });

      queryClient.invalidateQueries({ queryKey: ['dashboard', pet._id] });
      showToast('Schedule deleted.');
      // Reload in background to sync server state (no loading flash)
      void reloadSchedules(pet._id, { silent: true });
    } catch (e) {
      console.error('[handleDeleteEntry] API failed:', e);
      // Rollback optimistic removal on failure
      const err = e instanceof Error ? e.message : 'Unable to delete schedule.';
      showErrorToast(err);
      void reloadSchedules(pet._id, { silent: true });
    } finally {
      setDeletingId(null);
    }
  };

  const visibleSections = SCHEDULE_SECTIONS.filter(
    (section) =>
      (section.key !== 'grooming' || groomingVisible) && canViewSchedule(section.key),
  );

  const filterChips: { key: 'all' | ScheduleSectionKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'feeding', label: 'Feeding' },
    { key: 'walk', label: 'Walks' },
    { key: 'grooming', label: 'Grooming' },
    { key: 'medicine', label: 'Medicine' },
    { key: 'vaccination', label: 'Vaccines' },
  ];

  const filteredChips = filterChips.filter(
    (chip) => chip.key === 'all' || visibleSections.some((s) => s.key === chip.key)
  );

  const getEntryTime = (key: ScheduleSectionKey, entry: EditorEntry): Date => {
    if (key === 'feeding') return (entry as FeedingEntryState).feedingTime ?? new Date();
    if (key === 'walk') return (entry as WalkEntryState).walkClockTime ?? new Date();
    if (key === 'medicine') return (entry as MedicineEntryState).medicineTime ?? new Date();
    if (key === 'vaccination') return (entry as VaccinationEntryState).reminderTime ?? new Date();
    if (key === 'grooming') {
      const gDate = (entry as GroomingEntryState).scheduleDate.singleDate || new Date();
      return gDate;
    }
    return new Date();
  };

  const timelineItems = useMemo(() => {
    const list: {
      key: ScheduleSectionKey;
      entry: EditorEntry;
      time: Date;
      title: string;
      subtitle: string;
      sectionMeta: ScheduleSectionTheme;
    }[] = [];

    visibleSections.forEach((sectionMeta) => {
      if (selectedCategory !== 'all' && selectedCategory !== sectionMeta.key) {
        return;
      }

      const sectionState = sections[sectionMeta.key];
      const visibleEntries = sectionState.entries.filter(
        (entry: any) =>
          entry.status !== 'done' &&
          entry.status !== 'skipped' &&
          !entry.isComplete &&
          !(sectionMeta.key === 'grooming' && entry.performedAt),
      );

      visibleEntries.forEach((entry) => {
        list.push({
          key: sectionMeta.key,
          entry,
          time: getEntryTime(sectionMeta.key, entry),
          title: scheduleEntryTitle(sectionMeta.key, entry),
          subtitle: scheduleEntrySubtitle(sectionMeta.key, entry),
          sectionMeta,
        });
      });
    });

    return list.sort((a, b) => {
      const timeA = a.time.getHours() * 60 + a.time.getMinutes();
      const timeB = b.time.getHours() * 60 + b.time.getMinutes();
      return timeA - timeB;
    });
  }, [sections, visibleSections, selectedCategory]);

  const awaitingPet = petLoading && !pet;

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScheduleScreenHeader
        notificationCount={unreadCount}
        onNotificationsPress={onNotificationsPress}
        onJournalPress={canViewJournal ? onJournalPress : undefined}
        showJournal={canViewJournal}
        isPremium={isPremium}
        topInset={insets.top}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance + 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
         

          {/* Category Chips Selector */}
          {pet && canViewAnySchedule && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsContainer}
              contentContainerStyle={styles.chipsContent}
            >
              {filteredChips.map((chip) => {
                const isSelected = selectedCategory === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    onPress={() => setSelectedCategory(chip.key)}
                    style={[
                      styles.chipButton,
                      isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : { borderColor: Palette.gray[200] },
                    ]}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="caption"
                      weight="800"
                      color={isSelected ? '#FFFFFF' : HomeTheme.textMuted}
                    >
                      {chip.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {accessBannerMessage ? <View style={{ marginVertical: 12, padding: 12, backgroundColor: '#E3F2FD', borderRadius: 8 }}><AppText variant="caption">{accessBannerMessage}</AppText></View> : null}

          {awaitingPet ? (
            <View style={styles.awaitingPet}>
              <Skeleton width="100%" height={120} borderRadius={Radius.lg} />
            </View>
          ) : !pet ? (
            <View style={styles.emptyBox}>
              <AppText variant="bodySmall" color={HomeTheme.textMuted}>
                Add a pet from the Home tab to start building their care schedule.
              </AppText>
            </View>
          ) : !canViewAnySchedule ? (
            <View style={styles.emptyBox}>
              <AppText variant="bodySmall" color={HomeTheme.textMuted}>
                Schedule access was not shared for this pet. Switch pets or ask the owner to update your permissions.
              </AppText>
            </View>
          ) : (
            <View style={styles.timelineList}>
              {schedulesLoading && timelineItems.length === 0 ? (
                <ScheduleEntriesSkeleton />
              ) : timelineItems.length === 0 ? (
                <EmptyState
                  icon={
                    selectedCategory === 'all'
                      ? 'calendar-clock-outline'
                      : SCHEDULE_SECTIONS.find((s) => s.key === selectedCategory)?.icon || 'calendar-clock-outline'
                  }
                  title="No care routines yet"
                  description={
                    selectedCategory === 'all'
                      ? "Create feeding, walking, grooming, or medication schedules to keep your pet healthy and organised."
                      : `No ${filterChips.find((c) => c.key === selectedCategory)?.label?.toLowerCase() ?? selectedCategory} routines set up yet. Add one to get started.`
                  }
                  buttonLabel={
                    visibleSections.some((s) => (selectedCategory === 'all' || selectedCategory === s.key) && canEditSchedule(s.key))
                      ? selectedCategory === 'all'
                        ? 'Create First Schedule'
                        : `Add ${filterChips.find((c) => c.key === selectedCategory)?.label ?? 'Schedule'}`
                      : undefined
                  }
                  onButtonPress={() => {
                    if (selectedCategory === 'all') {
                      setFabMenuVisible(true);
                    } else {
                      const meta = SCHEDULE_SECTIONS.find((s) => s.key === selectedCategory);
                      if (meta) openAddEditor(meta);
                    }
                  }}
                  buttonVariant="success"
                />
              ) : (
                timelineItems.map(({ key, entry, title, subtitle, sectionMeta }) => {
                  const remoteId = scheduleEntryRemoteId(key, entry);
                  const canEdit = canEditSchedule(key);
                  return (
                    <ScheduleEntrySummaryCard
                      key={entry.id}
                      title={title}
                      subtitle={subtitle}
                      accentColor={brandColor}
                      accentBg={brandBg}
                      iconName={sectionMeta.icon}
                      onEdit={() => openEditEditor(sectionMeta, entry)}
                      onDelete={() => confirmDeleteEntry(sectionMeta, entry)}
                      deleting={!!remoteId && deletingId === remoteId}
                      readOnly={!canEdit}
                    />
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Action Button (FAB) */}
      {pet && canViewAnySchedule && visibleSections.some((s) => canEditSchedule(s.key)) && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: brandColor, bottom: tabBarClearance + 20 }]}
          onPress={() => {
            if (selectedCategory !== 'all') {
              const meta = SCHEDULE_SECTIONS.find((s) => s.key === selectedCategory);
              if (meta) openAddEditor(meta);
            } else {
              setFabMenuVisible(true);
            }
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* FAB Category Selector Modal */}
      <SafeModal
        visible={fabMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFabMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFabMenuVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="800" color={HomeTheme.text}>
                Add Care Schedule
              </AppText>
              <Pressable onPress={() => setFabMenuVisible(false)}>
                <Ionicons name="close" size={24} color={HomeTheme.textMuted} />
              </Pressable>
            </View>
            <View style={styles.modalList}>
              {visibleSections.filter(s => canEditSchedule(s.key)).map((section) => (
                <TouchableOpacity
                   key={section.key}
                  style={styles.modalItem}
                  onPress={() => {
                    setFabMenuVisible(false);
                    openAddEditor(section);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalIconWrap, { backgroundColor: brandBg }]}>
                    <MaterialCommunityIcons name={section.icon} size={22} color={brandColor} />
                  </View>
                  <AppText variant="body" weight="700" color={HomeTheme.text}>
                    {section.title}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </SafeModal>

      {editor?.section.key === 'feeding' ? (
        <LogFoodSheet
          visible
          petId={pet?._id ?? null}
          token={token}
          mealTypeOptions={mealTypeOptions}
          unitOptions={unitOptions}
          initialEntry={editor.entry as FeedingEntryState}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', pet?._id] });
            if (pet?._id) void reloadSchedules(pet._id);
          }}
          onClose={closeEditor}
        />
      ) : null}

      {editor?.section.key === 'walk' ? (
        <LogWalkSheet
          visible
          petId={pet?._id ?? null}
          token={token}
          initialEntry={editor.entry as WalkEntryState}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', pet?._id] });
            if (pet?._id) void reloadSchedules(pet._id);
          }}
          onClose={closeEditor}
        />
      ) : null}

      {editor?.section.key === 'medicine' ? (
        <LogMedicineSheet
          visible
          petId={pet?._id ?? null}
          token={token}
          initialEntry={editor.entry as MedicineEntryState}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', pet?._id] });
            if (pet?._id) void reloadSchedules(pet._id);
          }}
          onClose={closeEditor}
        />
      ) : null}

      {editor?.section.key === 'vaccination' ? (
        <LogVaccinationSheet
          visible
          petId={pet?._id ?? null}
          token={token}
          initialEntry={editor.entry as VaccinationEntryState}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', pet?._id] });
            if (pet?._id) void reloadSchedules(pet._id);
          }}
          onClose={closeEditor}
        />
      ) : null}

      {editor?.section.key === 'grooming' ? (
        <LogGroomingSheet
          visible
          petId={pet?._id ?? null}
          token={token}
          typeOptions={groomingTypeOptions}
          groomingVisible={groomingVisible}
          initialEntry={editor.entry as GroomingEntryState}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', pet?._id] });
            if (pet?._id) void reloadSchedules(pet._id);
          }}
          onClose={closeEditor}
        />
      ) : null}

      <AppConfirmModal
        visible={deleteModalVisible}
        title="Delete Schedule?"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (pendingDeleteInfo) {
            setDeleteModalVisible(false);
            await handleDeleteEntry(
              pendingDeleteInfo.sectionMeta.key,
              pendingDeleteInfo.remoteId,
              pendingDeleteInfo.entry,
            );
            setPendingDeleteInfo(null);
          }
        }}
        onCancel={() => {
          setDeleteModalVisible(false);
          setPendingDeleteInfo(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F7F1',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  awaitingPet: {
    marginBottom: Spacing.lg,
  },
  entriesSkeleton: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  emptyBox: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  emptyHintBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  emptyHintIcon: {
    marginBottom: Spacing.sm,
    opacity: 0.85,
  },
  chipsContainer: {
    marginBottom: Spacing.md,
    maxHeight: 40,
  },
  chipsContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineList: {
    gap: Spacing.xs,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 5.5,
      },
      android: { elevation: 8 },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalList: {
    gap: Spacing.sm,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  modalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
