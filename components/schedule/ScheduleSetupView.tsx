import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScheduleScreenHeader } from './ScheduleScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/Skeleton';
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
import {
  getCachedSchedules,
  setCachedSchedules,
} from '@/lib/schedule/scheduleCache';
import {
  scheduleEntryRemoteId,
  scheduleEntrySubtitle,
  scheduleEntryTitle,
} from '@/lib/schedule/mapSchedules';
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
}: ScheduleSetupViewProps) {
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token, user } = useAuth();
  const { pet, loading: petLoading } = useActivePet(token);
  const { unreadCount } = useNotifications(token);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    canViewSchedule,
    canEditSchedule,
    canViewJournal,
    canViewAnySchedule,
    accessBannerMessage,
  } = usePetPermissions(token, pet, user?._id);

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
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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
    async (petId: string, options?: { silent?: boolean }) => {
      if (!token) return;

      if (!options?.silent) {
        setSchedulesLoading(true);
      }

      try {
        const loaded = await loadExistingSchedules(token, petId, {
          groomingVisible: groomingVisibleRef.current,
        });
        setSections(loaded);
        setCachedSchedules(petId, loaded);
        setFormError(null);
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Unable to load schedules.');
      } finally {
        setSchedulesLoading(false);
      }
    },
    [token],
  );

  const focusReload = useCallback(() => {
    if (pet?._id) {
      void reloadSchedules(pet._id, { silent: true });
    }
  }, [pet?._id, reloadSchedules]);

  useFocusReload(focusReload, Boolean(token && pet?._id));

  useEffect(() => {
    if (!token || !pet?._id) {
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
          setSections(schedulesResult.value);
          setCachedSchedules(petId, schedulesResult.value);
        } else if (!cached) {
          setFormError('Unable to load saved schedules.');
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
  }, [token, pet?._id, pet?.species, petLoading, applyFeatureOptions]);

  const toggleSection = (key: ScheduleSectionKey, enabled: boolean) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }));
    setFormSuccess(null);
    setFormError(null);
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
    setFormSuccess(null);
    toggleSection(sectionMeta.key, true);
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
      setFormSuccess(msg);
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
    if (!remoteId || !token) return;

    const title = scheduleEntryTitle(sectionMeta.key, entry);

    Alert.alert('Delete schedule', `Remove "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void handleDeleteEntry(sectionMeta.key, remoteId),
      },
    ]);
  };

  const handleDeleteEntry = async (key: ScheduleSectionKey, remoteId: string) => {
    if (!token || !pet?._id || deletingId === remoteId) return;

    setDeletingId(remoteId);
    setFormError(null);
    setFormSuccess(null);

    try {
      await deleteScheduleEntry(token, key, remoteId);
      queryClient.invalidateQueries({ queryKey: ['dashboard', pet._id] });
      setFormSuccess('Schedule deleted.');
      showToast('Schedule deleted.');
      await reloadSchedules(pet._id);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Unable to delete schedule.';
      setFormError(err);
      showToast(err);
    } finally {
      setDeletingId(null);
    }
  };

  const visibleSections = SCHEDULE_SECTIONS.filter(
    (section) =>
      (section.key !== 'grooming' || groomingVisible) && canViewSchedule(section.key),
  );

  const awaitingPet = petLoading && !pet;

  const isPremium = user?.premiumStatus === 'premium';
  const brandColor = isPremium ? '#184F2E' : '#3A8F3B';
  const brandBg = isPremium ? '#E8F5E9' : '#EEF8EE';
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
          contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.subtitle}>
            Set up feeding, walks, medicine, vaccines, and grooming for your pet.
          </AppText>

          {accessBannerMessage ? <AuthInfoBanner message={accessBannerMessage} /> : null}

          {formSuccess ? <AuthInfoBanner message={formSuccess} /> : null}
          {formError ? <AuthErrorBanner message={formError} /> : null}

          {awaitingPet ? (
            <View style={styles.awaitingPet}>
              <Skeleton width="100%" height={120} borderRadius={Radius.lg} />
            </View>
          ) : !pet ? (
            <View style={styles.emptyBox}>
              <AppText variant="bodySmall" color={HomeTheme.textMuted}>
                Add a pet from Home to set up care schedules.
              </AppText>
            </View>
          ) : !canViewAnySchedule ? (
            <View style={styles.emptyBox}>
              <AppText variant="bodySmall" color={HomeTheme.textMuted}>
                Schedule access was not shared for this pet. Switch pets or ask the owner to update your permissions.
              </AppText>
            </View>
          ) : (
            visibleSections.map((sectionMeta) => {
              const sectionState = sections[sectionMeta.key];
              const canEdit = canEditSchedule(sectionMeta.key);
              const visibleEntries = sectionState.entries.filter(
                (entry: any) =>
                  entry.status !== 'done' &&
                  entry.status !== 'skipped' &&
                  !entry.isComplete &&
                  !(sectionMeta.key === 'grooming' && entry.performedAt),
              );
              return (
                <ScheduleSectionCard
                  key={sectionMeta.key}
                  section={sectionMeta}
                  enabled={sectionState.enabled}
                  onToggle={(enabled) => toggleSection(sectionMeta.key, enabled)}
                  canEdit={canEdit}
                >
                  {schedulesLoading && visibleEntries.length === 0 ? (
                    <ScheduleEntriesSkeleton />
                  ) : visibleEntries.length === 0 ? (
                    <View style={styles.emptyHintBox}>
                       <MaterialCommunityIcons
                        name={sectionMeta.icon}
                        size={28}
                        color={brandColor}
                        style={styles.emptyHintIcon}
                      />
                      <AppText variant="bodySmall" color={HomeTheme.textMuted} align="center">
                        No {sectionMeta.title.toLowerCase()} yet. Tap below to add your first one.
                      </AppText>
                    </View>
                  ) : (
                    visibleEntries.map((entry) => {
                      const remoteId = scheduleEntryRemoteId(sectionMeta.key, entry);
                      return (
                        <ScheduleEntrySummaryCard
                          key={entry.id}
                          title={scheduleEntryTitle(sectionMeta.key, entry)}
                          subtitle={scheduleEntrySubtitle(sectionMeta.key, entry)}
                          accentColor={brandColor}
                          accentBg={brandBg}
                          onEdit={() => openEditEditor(sectionMeta, entry)}
                          onDelete={() => confirmDeleteEntry(sectionMeta, entry)}
                          deleting={!!remoteId && deletingId === remoteId}
                          readOnly={!canEdit}
                        />
                      );
                    })
                  )}

                  {canEdit ? (
                    <TouchableOpacity
                      style={[scheduleFieldStyles.dashedAddBtn, { borderColor: brandColor, marginBottom: 20 }]}
                      onPress={() => openAddEditor(sectionMeta)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add-circle" size={20} color={brandColor} />
                      <AppText variant="bodySmall" weight="700" color={brandColor}>
                        {sectionMeta.addLabel}
                      </AppText>
                    </TouchableOpacity>
                  ) : null}
                </ScheduleSectionCard>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {editor?.section.key === 'feeding' ? (
        <LogFoodSheet
          visible
          petId={pet?._id ?? null}
          token={token}
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
          initialEntry={editor.entry as GroomingEntryState}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', pet?._id] });
            if (pet?._id) void reloadSchedules(pet._id);
          }}
          onClose={closeEditor}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
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
});
