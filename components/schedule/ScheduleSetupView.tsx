import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
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
import { hasEnabledSection, saveAllSchedules } from '@/lib/schedule/saveSchedules';
import type { ScheduleSectionKey, ScheduleSectionsState } from '@/lib/schedule/types';
import { fetchGroomingTypes } from '@/services/grooming/groomingApi';
import { fetchPetPermissions } from '@/services/schedules/feedingApi';
import type { GroomingTypeOption } from '@/types/grooming';
import { ScheduleSectionCard } from './ScheduleSectionCard';
import { SCHEDULE_SECTIONS } from './scheduleTheme';
import { scheduleFieldStyles } from './scheduleStyles';
import { FeedingEntryCard } from './entries/FeedingEntryCard';
import { WalkEntryCard } from './entries/WalkEntryCard';
import { MedicineEntryCard } from './entries/MedicineEntryCard';
import { VaccinationEntryCard } from './entries/VaccinationEntryCard';
import { GroomingEntryCard } from './entries/GroomingEntryCard';

const TAB_BAR_CLEARANCE = 100;

export function ScheduleSetupView() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { pet, loading: petLoading } = useActivePet(token);

  const [sections, setSections] = useState<ScheduleSectionsState>(() => createInitialScheduleState());
  const [mealTypeOptions, setMealTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [groomingTypeOptions, setGroomingTypeOptions] = useState<GroomingTypeOption[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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
      const defaultMeal = mealOpts[0]?.value ?? '';
      const defaultUnit = pickDefaultUnitFromList(perms.speciesFeatures?.inventoryUnits ?? []);
      const defaultGrooming = groomingInfo.types?.[0]?.value ?? '';

      setMealTypeOptions(mealOpts);
      setUnitOptions(unitOpts);
      setGroomingTypeOptions(groomingInfo.types ?? []);
      setGroomingVisible(groomingInfo.groomingVisible);
      setSections(createInitialScheduleState(defaultMeal, defaultUnit, defaultGrooming));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Unable to load schedule options.');
      setSections(createInitialScheduleState());
    } finally {
      setFeaturesLoading(false);
    }
  }, [token, pet?._id]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const toggleSection = (key: ScheduleSectionKey, enabled: boolean) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }));
    setFormSuccess(null);
    setFormError(null);
  };

  const addEntry = (key: ScheduleSectionKey) => {
    setSections((prev) => {
      if (key === 'feeding') {
        return {
          ...prev,
          feeding: {
            ...prev.feeding,
            entries: [
              ...prev.feeding.entries,
              createFeedingEntry(mealTypeOptions[0]?.value ?? '', unitOptions[0]?.value ?? ''),
            ],
          },
        };
      }
      if (key === 'walk') {
        return { ...prev, walk: { ...prev.walk, entries: [...prev.walk.entries, createWalkEntry()] } };
      }
      if (key === 'medicine') {
        return {
          ...prev,
          medicine: { ...prev.medicine, entries: [...prev.medicine.entries, createMedicineEntry()] },
        };
      }
      if (key === 'vaccination') {
        return {
          ...prev,
          vaccination: {
            ...prev.vaccination,
            entries: [...prev.vaccination.entries, createVaccinationEntry()],
          },
        };
      }
      return {
        ...prev,
        grooming: {
          ...prev.grooming,
          entries: [
            ...prev.grooming.entries,
            createGroomingEntry(groomingTypeOptions[0]?.value ?? ''),
          ],
        },
      };
    });
  };

  const removeEntry = (key: ScheduleSectionKey, id: string) => {
    setSections((prev) => {
      const section = prev[key];
      if (section.entries.length <= 1) return prev;
      return {
        ...prev,
        [key]: { ...section, entries: section.entries.filter((e) => e.id !== id) },
      };
    });
  };

  const handleSaveAll = async () => {
    if (!token || !pet?._id) {
      setFormError('Add a pet before saving schedules.');
      return;
    }
    if (!hasEnabledSection(sections)) {
      setFormError('Turn on at least one schedule section to save.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const result = await saveAllSchedules(token, pet._id, sections, { groomingVisible });
      if (result.errors.length > 0 && result.savedCount === 0) {
        setFormError(result.errors.join('\n'));
      } else if (result.errors.length > 0) {
        setFormSuccess(`${result.savedCount} schedule(s) saved.`);
        setFormError(result.errors.join('\n'));
      } else {
        setFormSuccess(`${result.savedCount} schedule(s) saved successfully.`);
        setSections(createInitialScheduleState(
          mealTypeOptions[0]?.value ?? '',
          unitOptions[0]?.value ?? '',
          groomingTypeOptions[0]?.value ?? '',
        ));
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Unable to save schedules.');
    } finally {
      setSaving(false);
    }
  };

  const visibleSections = SCHEDULE_SECTIONS.filter(
    (section) => section.key !== 'grooming' || groomingVisible,
  );

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

          {petLoading || featuresLoading ? (
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

              {visibleSections.map((sectionMeta) => (
                <ScheduleSectionCard
                  key={sectionMeta.key}
                  section={sectionMeta}
                  enabled={sections[sectionMeta.key].enabled}
                  onToggle={(enabled) => toggleSection(sectionMeta.key, enabled)}
                >
                  {sectionMeta.key === 'feeding'
                    ? sections.feeding.entries.map((entry, index) => (
                        <FeedingEntryCard
                          key={entry.id}
                          entry={entry}
                          index={index}
                          accentColor={sectionMeta.color}
                          mealTypeOptions={mealTypeOptions}
                          unitOptions={unitOptions}
                          canRemove={sections.feeding.entries.length > 1}
                          onChange={(next) =>
                            setSections((prev) => ({
                              ...prev,
                              feeding: {
                                ...prev.feeding,
                                entries: prev.feeding.entries.map((e) =>
                                  e.id === next.id ? next : e,
                                ),
                              },
                            }))
                          }
                          onRemove={() => removeEntry('feeding', entry.id)}
                        />
                      ))
                    : null}

                  {sectionMeta.key === 'walk'
                    ? sections.walk.entries.map((entry, index) => (
                        <WalkEntryCard
                          key={entry.id}
                          entry={entry}
                          index={index}
                          accentColor={sectionMeta.color}
                          canRemove={sections.walk.entries.length > 1}
                          onChange={(next) =>
                            setSections((prev) => ({
                              ...prev,
                              walk: {
                                ...prev.walk,
                                entries: prev.walk.entries.map((e) => (e.id === next.id ? next : e)),
                              },
                            }))
                          }
                          onRemove={() => removeEntry('walk', entry.id)}
                        />
                      ))
                    : null}

                  {sectionMeta.key === 'medicine'
                    ? sections.medicine.entries.map((entry, index) => (
                        <MedicineEntryCard
                          key={entry.id}
                          entry={entry}
                          index={index}
                          accentColor={sectionMeta.color}
                          canRemove={sections.medicine.entries.length > 1}
                          onChange={(next) =>
                            setSections((prev) => ({
                              ...prev,
                              medicine: {
                                ...prev.medicine,
                                entries: prev.medicine.entries.map((e) =>
                                  e.id === next.id ? next : e,
                                ),
                              },
                            }))
                          }
                          onRemove={() => removeEntry('medicine', entry.id)}
                        />
                      ))
                    : null}

                  {sectionMeta.key === 'vaccination'
                    ? sections.vaccination.entries.map((entry, index) => (
                        <VaccinationEntryCard
                          key={entry.id}
                          entry={entry}
                          index={index}
                          accentColor={sectionMeta.color}
                          canRemove={sections.vaccination.entries.length > 1}
                          onChange={(next) =>
                            setSections((prev) => ({
                              ...prev,
                              vaccination: {
                                ...prev.vaccination,
                                entries: prev.vaccination.entries.map((e) =>
                                  e.id === next.id ? next : e,
                                ),
                              },
                            }))
                          }
                          onRemove={() => removeEntry('vaccination', entry.id)}
                        />
                      ))
                    : null}

                  {sectionMeta.key === 'grooming'
                    ? sections.grooming.entries.map((entry, index) => (
                        <GroomingEntryCard
                          key={entry.id}
                          entry={entry}
                          index={index}
                          accentColor={sectionMeta.color}
                          accentBg={sectionMeta.bg}
                          typeOptions={groomingTypeOptions}
                          canRemove={sections.grooming.entries.length > 1}
                          onChange={(next) =>
                            setSections((prev) => ({
                              ...prev,
                              grooming: {
                                ...prev.grooming,
                                entries: prev.grooming.entries.map((e) =>
                                  e.id === next.id ? next : e,
                                ),
                              },
                            }))
                          }
                          onRemove={() => removeEntry('grooming', entry.id)}
                        />
                      ))
                    : null}

                  <TouchableOpacity
                    style={scheduleFieldStyles.addBtn}
                    onPress={() => addEntry(sectionMeta.key)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={20} color={sectionMeta.color} />
                    <AppText variant="bodySmall" weight="700" color={sectionMeta.color}>
                      {sectionMeta.addLabel}
                    </AppText>
                  </TouchableOpacity>
                </ScheduleSectionCard>
              ))}

              <AppButton
                title="Save All Schedules"
                onPress={handleSaveAll}
                loading={saving}
                disabled={saving || featuresLoading}
                variant="success"
                size="md"
                style={styles.saveBtn}
                textStyle={styles.saveBtnText}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    backgroundColor: HomeTheme.cardGreen,
    minHeight: 52,
    marginTop: Spacing.sm,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
