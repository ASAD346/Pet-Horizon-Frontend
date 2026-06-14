import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePet } from '@/hooks/useActivePet';
import { mealTypeOptionsForSpecies, unitOptionsForSpecies } from '@/lib/feeding/feedingForm';
import {
  createFeedingEntry,
  createGroomingEntry,
  createInitialScheduleState,
  createMedicineEntry,
  createVaccinationEntry,
  createWalkEntry,
  pickDefaultUnitFromList,
} from '@/lib/schedule/defaults';
import { deleteScheduleEntry } from '@/lib/schedule/deleteScheduleEntry';
import { loadExistingSchedules } from '@/lib/schedule/loadSchedules';
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
import { ScheduleEntryEditorSheet } from './ScheduleEntryEditorSheet';
import { SCHEDULE_SECTIONS, type ScheduleSectionTheme } from './scheduleTheme';
import { scheduleFieldStyles } from './scheduleStyles';

const TAB_BAR_CLEARANCE = 100;

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

export function ScheduleSetupView() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { pet, loading: petLoading } = useActivePet(token);

  const [sections, setSections] = useState<ScheduleSectionsState>(() => createInitialScheduleState());
  const [mealTypeOptions, setMealTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [groomingTypeOptions, setGroomingTypeOptions] = useState<GroomingTypeOption[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [defaultMeal, setDefaultMeal] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('');
  const [defaultGrooming, setDefaultGrooming] = useState('');
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const reloadSchedules = useCallback(async () => {
    if (!token || !pet?._id) {
      setSections(createInitialScheduleState());
      return;
    }

    setSchedulesLoading(true);
    try {
      const loaded = await loadExistingSchedules(token, pet._id, { groomingVisible });
      setSections(loaded);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Unable to load schedules.');
    } finally {
      setSchedulesLoading(false);
    }
  }, [token, pet?._id, groomingVisible]);

  const loadFeatures = useCallback(async () => {
    if (!token || !pet?._id) {
      setMealTypeOptions([]);
      setUnitOptions([]);
      setGroomingTypeOptions([]);
      setSections(createInitialScheduleState());
      return;
    }

    setFeaturesLoading(true);
    setFormError(null);

    try {
      const [perms, groomingInfo] = await Promise.all([
        fetchPetPermissions(token, pet._id),
        fetchGroomingTypes(token, pet._id),
      ]);

      const mealOpts = mealTypeOptionsForSpecies(perms.speciesFeatures?.mealTypes ?? []);
      const unitOpts = unitOptionsForSpecies(perms.speciesFeatures?.inventoryUnits ?? []);
      const meal = mealOpts[0]?.value ?? '';
      const unit = pickDefaultUnitFromList(perms.speciesFeatures?.inventoryUnits ?? []);
      const grooming = groomingInfo.types?.[0]?.value ?? '';

      setMealTypeOptions(mealOpts);
      setUnitOptions(unitOpts);
      setGroomingTypeOptions(groomingInfo.types ?? []);
      setGroomingVisible(groomingInfo.groomingVisible);
      setDefaultMeal(meal);
      setDefaultUnit(unit);
      setDefaultGrooming(grooming);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Unable to load schedule options.');
    } finally {
      setFeaturesLoading(false);
    }
  }, [token, pet?._id]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  useEffect(() => {
    if (!featuresLoading) reloadSchedules();
  }, [reloadSchedules, featuresLoading]);

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
    if (!editor || !token || !pet?._id) return;

    setEditorSaving(true);
    setEditorError(null);

    try {
      await saveScheduleEntry(token, pet._id, editor.section.key, editor.entry, {
        groomingVisible,
      });
      setEditor(null);
      setFormSuccess(
        editor.mode === 'add' ? 'Schedule added successfully.' : 'Schedule updated successfully.',
      );
      await reloadSchedules();
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : 'Unable to save schedule.');
    } finally {
      setEditorSaving(false);
    }
  };

  const confirmDeleteEntry = (
    sectionMeta: ScheduleSectionTheme,
    entry: EditorEntry,
  ) => {
    const remoteId = scheduleEntryRemoteId(sectionMeta.key, entry);
    if (!remoteId || !token) return;

    const title = scheduleEntryTitle(sectionMeta.key, entry);

    Alert.alert(
      'Delete schedule',
      `Remove "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void handleDeleteEntry(sectionMeta.key, remoteId),
        },
      ],
    );
  };

  const handleDeleteEntry = async (key: ScheduleSectionKey, remoteId: string) => {
    if (!token) return;

    setDeletingId(remoteId);
    setFormError(null);
    setFormSuccess(null);

    try {
      await deleteScheduleEntry(token, key, remoteId);
      setFormSuccess('Schedule deleted.');
      await reloadSchedules();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Unable to delete schedule.');
    } finally {
      setDeletingId(null);
    }
  };

  const visibleSections = SCHEDULE_SECTIONS.filter(
    (section) => section.key !== 'grooming' || groomingVisible,
  );

  const loading = petLoading || featuresLoading || schedulesLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, Spacing.md) + TAB_BAR_CLEARANCE },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="h2" weight="800" color={HomeTheme.text}>
                Care Schedules
              </AppText>
              <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.subtitle}>
                Set up feeding, walks, medicine, vaccines, and grooming for your pet.
              </AppText>
            </View>
            <View style={styles.headerArt}>
              <MaterialCommunityIcons name="calendar-heart" size={36} color={HomeTheme.cardGreen} />
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
          ) : !pet ? (
            <View style={styles.emptyBox}>
              <AppText variant="bodySmall" color={HomeTheme.textMuted}>
                Add a pet from Home to set up care schedules.
              </AppText>
            </View>
          ) : (
            <>
              {formSuccess ? <AuthInfoBanner message={formSuccess} /> : null}
              {formError ? <AuthErrorBanner message={formError} /> : null}

              {visibleSections.map((sectionMeta) => {
                const sectionState = sections[sectionMeta.key];
                return (
                  <ScheduleSectionCard
                    key={sectionMeta.key}
                    section={sectionMeta}
                    enabled={sectionState.enabled}
                    onToggle={(enabled) => toggleSection(sectionMeta.key, enabled)}
                  >
                    {sectionState.entries.length === 0 ? (
                      <AppText variant="caption" color={HomeTheme.textMuted} style={styles.emptyHint}>
                        No schedules yet. Tap below to add one.
                      </AppText>
                    ) : (
                      sectionState.entries.map((entry) => {
                        const remoteId = scheduleEntryRemoteId(sectionMeta.key, entry);
                        return (
                          <ScheduleEntrySummaryCard
                            key={entry.id}
                            title={scheduleEntryTitle(sectionMeta.key, entry)}
                            subtitle={scheduleEntrySubtitle(sectionMeta.key, entry)}
                            accentColor={sectionMeta.color}
                            accentBg={sectionMeta.bg}
                            onEdit={() => openEditEditor(sectionMeta, entry)}
                            onDelete={() => confirmDeleteEntry(sectionMeta, entry)}
                            deleting={!!remoteId && deletingId === remoteId}
                          />
                        );
                      })
                    )}

                    <TouchableOpacity
                      style={scheduleFieldStyles.addBtn}
                      onPress={() => openAddEditor(sectionMeta)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add-circle" size={20} color={sectionMeta.color} />
                      <AppText variant="bodySmall" weight="700" color={sectionMeta.color}>
                        {sectionMeta.addLabel}
                      </AppText>
                    </TouchableOpacity>
                  </ScheduleSectionCard>
                );
              })}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {editor ? (
        <ScheduleEntryEditorSheet
          visible
          mode={editor.mode}
          section={editor.section}
          entry={editor.entry}
          mealTypeOptions={mealTypeOptions}
          unitOptions={unitOptions}
          groomingTypeOptions={groomingTypeOptions}
          saving={editorSaving}
          error={editorError}
          onChange={(entry) => setEditor((prev) => (prev ? { ...prev, entry } : prev))}
          onSave={() => void handleEditorSave()}
          onClose={closeEditor}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: HomeTheme.background,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  headerArt: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginVertical: Spacing.xl,
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
  emptyHint: {
    marginBottom: Spacing.sm,
  },
});
