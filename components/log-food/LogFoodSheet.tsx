import { getErrorMessage } from '@/lib/api/errors';
import {
    addMinutesToTimeHHmm,
    dateToTimeHHmm,
    DEFAULT_REMINDER_MINUTES,
    defaultFeedingTimeDate,
    mealTypeOptionsForSpecies,
    pickDefaultUnit,
    unitOptionsForSpecies,
} from '@/lib/feeding/feedingForm';
import { log } from '@/lib/log';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  createDefaultScheduleDate,
  validateScheduleDate,
  validateFutureSchedule,
} from '@/lib/schedule/scheduleDate';
import { fetchPetPermissions } from '@/services/schedules/feedingApi';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { useToast } from '@/hooks/useToast';
import { AppText } from '@/components/ui/AppText';
import { SkeletonChipGrid } from '@/components/ui/skeletons';
import { FormSheetShell } from '../sheets';
import { FeedingEntryCard } from '../schedule/entries/FeedingEntryCard';
import type { FeedingEntryState } from '@/lib/schedule/types';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';
import { getPetPermissionCache } from '@/lib/pet/petPermissionCache';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Skeleton } from '@/components/ui/Skeleton';

const FOOD_THEME = LOG_SHEET_THEMES.food;

interface LogFoodSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
  initialEntry?: FeedingEntryState | null;
  mealTypeOptions?: { value: string; label: string }[];
  unitOptions?: { value: string; label: string }[];
  hasPermission?: boolean;
}

export function LogFoodSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
  initialEntry,
  mealTypeOptions: propsMealTypeOptions,
  unitOptions: propsUnitOptions,
  hasPermission = true,
}: LogFoodSheetProps) {
  const { canEdit, loading: permissionsLoading } = usePermissionGuard(petId, 'feeding');
  const resolvedReadOnly = !hasPermission || !canEdit;

  const [mealTypeOptions, setMealTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [repeatDaily, setRepeatDaily] = useState(true);
  const { showToast, showErrorToast } = useToast();

  const [entry, setEntry] = useState<FeedingEntryState>(() => (initialEntry ? { ...initialEntry } : {
    id: 'draft',
    mealType: '',
    amount: '2',
    unit: '',
    feedingTime: defaultFeedingTimeDate(),
    scheduleDate: createDefaultScheduleDate('single'),
    reminderMinutes: DEFAULT_REMINDER_MINUTES,
    notificationsOn: true,
    notes: '',
  }));

  const resetForm = useCallback(() => {
    setRepeatDaily(true);
    if (initialEntry) {
      setEntry({ ...initialEntry });
    } else {
      setEntry({
        id: 'draft',
        mealType: '',
        amount: '2',
        unit: '',
        feedingTime: defaultFeedingTimeDate(),
        scheduleDate: createDefaultScheduleDate('single'),
        reminderMinutes: DEFAULT_REMINDER_MINUTES,
        notificationsOn: true,
        notes: '',
      });
    }
  }, [initialEntry]);

  const loadSpeciesFeatures = useCallback(async () => {
    if (propsMealTypeOptions?.length && propsUnitOptions?.length) {
      setMealTypeOptions(propsMealTypeOptions);
      setUnitOptions(propsUnitOptions);
      setEntry((prev) => {
        const mealVal = prev.mealType || initialEntry?.mealType || (propsMealTypeOptions[0]?.value ?? '');
        const unitVal = prev.unit || initialEntry?.unit || propsUnitOptions[0]?.value || '';
        return {
          ...prev,
          mealType: mealVal,
          unit: unitVal,
        };
      });
      setFeaturesLoading(false);
      return;
    }

    if (!petId || !token) {
      setMealTypeOptions([]);
      setUnitOptions([]);
      log.warn('LogFood', 'Cannot load species features — missing pet or token', {
        petId,
        hasToken: Boolean(token),
      });
      return;
    }

    const cacheKey = `${token}:${petId}`;
    const cachedPermissions = getPetPermissionCache(cacheKey);
    if (cachedPermissions) {
      const features = cachedPermissions.speciesFeatures;
      const mealOptions = mealTypeOptionsForSpecies(features?.mealTypes ?? []);
      const unitOpts = unitOptionsForSpecies(features?.inventoryUnits ?? []);

      setMealTypeOptions(mealOptions);
      setUnitOptions(unitOpts);
      setEntry((prev) => {
        const mealVal = prev.mealType || initialEntry?.mealType || (mealOptions[0]?.value ?? '');
        const unitVal = prev.unit || initialEntry?.unit || pickDefaultUnit(features?.inventoryUnits ?? []);
        return {
          ...prev,
          mealType: mealVal,
          unit: unitVal,
        };
      });
      setFeaturesLoading(false);
      return;
    }

    try {
      const perms = await fetchPetPermissions(token, petId);
      const features = perms.speciesFeatures;
      const mealOptions = mealTypeOptionsForSpecies(features?.mealTypes ?? []);
      const unitOpts = unitOptionsForSpecies(features?.inventoryUnits ?? []);

      setMealTypeOptions(mealOptions);
      setUnitOptions(unitOpts);
      setEntry((prev) => {
        const mealVal = prev.mealType || initialEntry?.mealType || (mealOptions[0]?.value ?? '');
        const unitVal = prev.unit || initialEntry?.unit || pickDefaultUnit(features?.inventoryUnits ?? []);
        return {
          ...prev,
          mealType: mealVal,
          unit: unitVal,
        };
      });
    } catch (e) {
      setMealTypeOptions([]);
      setUnitOptions([]);
      showErrorToast(getErrorMessage(e));
      log.fail('LogFood', 'Load species features failed', getErrorMessage(e));
    } finally {
      setFeaturesLoading(false);
    }
  }, [petId, token, propsMealTypeOptions, propsUnitOptions, initialEntry, showErrorToast]);

  useEffect(() => {
    if (visible) {
      setSaving(false);
      resetForm();
      loadSpeciesFeatures();
    } else {
      setSaving(false);
    }
  }, [visible, resetForm, loadSpeciesFeatures]);

  const handleSave = async () => {
    if (!canEdit) {
      showToast("Read-only access: You cannot modify this entry.");
      return;
    }
    if (saving) return;
    if (!petId || !token) {
      showErrorToast('Add a pet before saving a feeding schedule.');
      return;
    }
    if (!entry.mealType) {
      showErrorToast('Select a meal type.');
      return;
    }
    if (!entry.unit) {
      showErrorToast('Select a unit.');
      return;
    }
    if (!entry.amount.trim()) {
      showErrorToast('Enter an amount.');
      return;
    }
    const isEdit = Boolean(entry.scheduleId);
    const allowPastOrPresent = !isEdit;
    const dateError = validateFutureSchedule(entry.scheduleDate, entry.feedingTime, isEdit, allowPastOrPresent);
    if (dateError) {
      showErrorToast(dateError);
      return;
    }

    const timeHHmm = dateToTimeHHmm(entry.feedingTime);

    setSaving(true);
    try {
      const entryToSave = {
        ...entry,
        scheduleDate: isEdit
          ? entry.scheduleDate
          : (repeatDaily ? createDefaultScheduleDate('ongoing') : createDefaultScheduleDate('single')),
      };
      await saveScheduleEntry(token, petId, 'feeding', entryToSave, {
        isCompleted: !isEdit,
        allowPastOrPresent,
      });
      log.ok('LogFood', isEdit ? 'Feeding schedule updated' : 'Feeding logged', { mealType: entry.mealType, time: timeHHmm, unit: entry.unit });
      showToast(isEdit ? 'Feeding schedule updated successfully!' : (repeatDaily ? 'Meal logged & daily schedule created!' : 'Meal logged successfully!'));
      setSaving(false);
      onSaved?.();
      onClose();
    } catch (e) {
      setSaving(false);
      showErrorToast(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (permissionsLoading) {
    return (
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title={entry.scheduleId ? 'Edit Feeding' : 'Log Food'}
        subtitle="Schedule meals & feeding reminders"
        icon={FOOD_THEME.icon}
        accentColor={FOOD_THEME.color}
        accentBg={FOOD_THEME.bg}
        saveLabel={undefined}
        onSave={undefined}
        saving={false}
        error={null}
        isReadOnly={true}
        isLoading={true}
        compact
      >
        <View style={{ padding: 16, gap: 16 }}>
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={48} borderRadius={8} />
          <Skeleton width="30%" height={16} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={48} borderRadius={8} />
        </View>
      </FormSheetShell>
    );
  }

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title={entry.scheduleId ? 'Edit Feeding' : 'Log Food'}
      subtitle={entry.scheduleId ? 'Update scheduled meal & reminders' : 'Log pet meal & optionally repeat daily'}
      icon={FOOD_THEME.icon}
      accentColor={FOOD_THEME.color}
      accentBg={FOOD_THEME.bg}
      saveLabel={
        resolvedReadOnly
          ? undefined
          : entry.scheduleId
          ? 'Save Changes'
          : repeatDaily
          ? 'Log & Schedule Daily'
          : 'Log Meal Now'
      }
      onSave={handleSave}
      saving={saving}
      saveDisabled={featuresLoading || !entry.mealType || !entry.unit || resolvedReadOnly}
      isReadOnly={resolvedReadOnly}
      compact
    >
      {featuresLoading ? (
        <SkeletonChipGrid count={4} />
      ) : (
        <>
          <FeedingEntryCard
            entry={entry}
            index={0}
            accentColor={FOOD_THEME.color}
            accentBg={FOOD_THEME.bg}
            mealTypeOptions={mealTypeOptions}
            unitOptions={unitOptions}
            canRemove={false}
            embeddedInSheet
            hideScheduleDate={!entry.scheduleId}
            onChange={setEntry}
            onRemove={() => {}}
          />

          {!entry.scheduleId ? (
            <View style={styles.scheduleOptionCard}>
              <View style={styles.scheduleOptionText}>
                <AppText variant="body" weight="700" color="#1E293B">
                  Repeat daily
                </AppText>
                <AppText variant="caption" color="#64748B">
                  Also schedule this meal for tomorrow and upcoming days
                </AppText>
              </View>
              <Switch
                value={repeatDaily}
                onValueChange={setRepeatDaily}
                trackColor={{ false: '#E2E8F0', true: '#FDE68A' }}
                thumbColor={repeatDaily ? '#D97706' : '#94A3B8'}
              />
            </View>
          ) : null}
        </>
      )}
    </FormSheetShell>
  );
}

const styles = StyleSheet.create({
  scheduleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  scheduleOptionText: {
    flex: 1,
    gap: 2,
  },
});
