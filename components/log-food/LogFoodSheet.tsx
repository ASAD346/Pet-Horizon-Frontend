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
} from '@/lib/schedule/scheduleDate';
import { fetchPetPermissions } from '@/services/schedules/feedingApi';
import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { SkeletonChipGrid } from '@/components/ui/skeletons';
import { FormSheetShell } from '../sheets';
import { FeedingEntryCard } from '../schedule/entries/FeedingEntryCard';
import type { FeedingEntryState } from '@/lib/schedule/types';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';
import { getPetPermissionCache } from '@/lib/pet/petPermissionCache';

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
}: LogFoodSheetProps) {
  const [mealTypeOptions, setMealTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entry, setEntry] = useState<FeedingEntryState>(() => ({
    id: 'draft',
    mealType: '',
    amount: '2',
    unit: '',
    feedingTime: defaultFeedingTimeDate(),
    scheduleDate: createDefaultScheduleDate('ongoing'),
    reminderMinutes: DEFAULT_REMINDER_MINUTES,
    notificationsOn: true,
    notes: '',
  }));

  const resetForm = useCallback(() => {
    if (initialEntry) {
      setEntry({ ...initialEntry });
    } else {
      setEntry({
        id: 'draft',
        mealType: '',
        amount: '2',
        unit: '',
        feedingTime: defaultFeedingTimeDate(),
        scheduleDate: createDefaultScheduleDate('ongoing'),
        reminderMinutes: DEFAULT_REMINDER_MINUTES,
        notificationsOn: true,
        notes: '',
      });
    }
    setError(null);
  }, [initialEntry]);

  const loadSpeciesFeatures = useCallback(async () => {
    if (propsMealTypeOptions?.length && propsUnitOptions?.length) {
      setMealTypeOptions(propsMealTypeOptions);
      setUnitOptions(propsUnitOptions);
      setEntry((prev) => ({
        ...prev,
        mealType: prev.mealType || (propsMealTypeOptions[0]?.value ?? ''),
        unit: prev.unit || propsUnitOptions[0]?.value || '',
      }));
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

    // Try reading from permission cache first for instant loading
    const cacheKey = `${token}:${petId}`;
    const cachedPermissions = getPetPermissionCache(cacheKey);
    if (cachedPermissions) {
      const features = cachedPermissions.speciesFeatures;
      const mealOptions = mealTypeOptionsForSpecies(features?.mealTypes ?? []);
      const unitOpts = unitOptionsForSpecies(features?.inventoryUnits ?? []);

      setMealTypeOptions(mealOptions);
      setUnitOptions(unitOpts);
      setEntry((prev) => ({
        ...prev,
        mealType: prev.mealType || (mealOptions[0]?.value ?? ''),
        unit: prev.unit || pickDefaultUnit(features?.inventoryUnits ?? []),
      }));
      setFeaturesLoading(false);
      return;
    }

    setFeaturesLoading(true);
    setError(null);
    try {
      const perms = await fetchPetPermissions(token, petId);
      const features = perms.speciesFeatures;
      const mealOptions = mealTypeOptionsForSpecies(features?.mealTypes ?? []);
      const unitOpts = unitOptionsForSpecies(features?.inventoryUnits ?? []);

      setMealTypeOptions(mealOptions);
      setUnitOptions(unitOpts);
      setEntry((prev) => ({
        ...prev,
        mealType: prev.mealType || (mealOptions[0]?.value ?? ''),
        unit: prev.unit || pickDefaultUnit(features?.inventoryUnits ?? []),
      }));
    } catch (e) {
      setMealTypeOptions([]);
      setUnitOptions([]);
      setError(getErrorMessage(e));
      log.fail('LogFood', 'Load species features failed', getErrorMessage(e));
    } finally {
      setFeaturesLoading(false);
    }
  }, [petId, token, propsMealTypeOptions, propsUnitOptions]);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadSpeciesFeatures();
    }
  }, [visible, resetForm, loadSpeciesFeatures]);

  const { showToast } = useToast();

  const handleSave = async () => {
    if (saving) return;
    if (!petId || !token) {
      setError('Add a pet before saving a feeding schedule.');
      return;
    }
    if (!entry.mealType) {
      setError('Select a meal type.');
      return;
    }
    if (!entry.unit) {
      setError('Select a unit.');
      return;
    }
    if (!entry.amount.trim()) {
      setError('Enter an amount.');
      return;
    }
    const dateError = validateScheduleDate(entry.scheduleDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    const timeHHmm = dateToTimeHHmm(entry.feedingTime);

    setSaving(true);
    setError(null);
    try {
      await saveScheduleEntry(token, petId, 'feeding', entry);
      const isEdit = Boolean(entry.scheduleId);
      log.ok('LogFood', isEdit ? 'Feeding schedule updated' : 'Feeding schedule saved', { mealType: entry.mealType, time: timeHHmm, unit: entry.unit });
      showToast(isEdit ? 'Feeding schedule updated successfully!' : 'Food logged successfully!');
      onSaved?.();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title={entry.scheduleId ? 'Edit Feeding' : 'Log Food'}
      icon={FOOD_THEME.icon}
      accentColor={FOOD_THEME.color}
      accentBg={FOOD_THEME.bg}
      saveLabel={entry.scheduleId ? 'Save Changes' : 'Save Feeding'}
      onSave={handleSave}
      saving={saving}
      saveDisabled={featuresLoading || !entry.mealType || !entry.unit}
      error={error}
      compact
    >
      {featuresLoading ? (
        <SkeletonChipGrid count={4} />
      ) : (
        <FeedingEntryCard
          entry={entry}
          index={0}
          accentColor={FOOD_THEME.color}
          accentBg={FOOD_THEME.bg}
          mealTypeOptions={mealTypeOptions}
          unitOptions={unitOptions}
          canRemove={false}
          embeddedInSheet
          onChange={setEntry}
          onRemove={() => {}}
        />
      )}
    </FormSheetShell>
  );
}
