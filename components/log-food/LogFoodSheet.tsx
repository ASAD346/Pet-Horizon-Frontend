import { getErrorMessage } from '@/lib/api/errors';
import {
    addMinutesToTimeHHmm,
    dateToTimeHHmm,
    DEFAULT_REMINDER_MINUTES,
    defaultFeedingTimeDate,
    formatTimeDisplay,
    getReminderMinutesLabel,
    mealTypeOptionsForSpecies,
    pickDefaultUnit,
    REMINDER_MINUTES_OPTIONS,
    unitOptionsForSpecies,
} from '@/lib/feeding/feedingForm';
import { log } from '@/lib/log';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import { createFeedingSchedule, fetchPetPermissions } from '@/services/schedules/feedingApi';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  FormChipRow,
  FormPickerField,
  FormSection,
  FormSectionLabel,
  FormSheetShell,
  FormSwitchRow,
  FormTextField,
  SheetOptionPicker,
  ThemedTimePicker,
  formSheetStyles,
} from '../sheets';
import type { SheetOption } from '../sheets';
import { AppText } from '../ui/AppText';
import { HomeTheme } from '../../constants/theme';

const REMINDER_MINUTES_PICKER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

const FOOD_THEME = LOG_SHEET_THEMES.food;

interface LogFoodSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

export function LogFoodSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogFoodSheetProps) {
  const [mealTypeOptions, setMealTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [mealType, setMealType] = useState('');
  const [amount, setAmount] = useState('2');
  const [unit, setUnit] = useState('');
  const [feedingTime, setFeedingTime] = useState(defaultFeedingTimeDate);
  const [reminderMinutes, setReminderMinutes] = useState(DEFAULT_REMINDER_MINUTES);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [notes, setNotes] = useState('');
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [feedingTimePickerVisible, setFeedingTimePickerVisible] = useState(false);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setAmount('2');
    setFeedingTime(defaultFeedingTimeDate());
    setReminderMinutes(DEFAULT_REMINDER_MINUTES);
    setMealType('');
    setUnit('');
    setUnitOptions([]);
    setNotificationsOn(true);
    setNotes('');
    setError(null);
  }, []);

  const loadSpeciesFeatures = useCallback(async () => {
    if (!petId || !token) {
      setMealTypeOptions([]);
      setUnitOptions([]);
      setMealType('');
      setUnit('');
      log.warn('LogFood', 'Cannot load species features — missing pet or token', {
        petId,
        hasToken: Boolean(token),
      });
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
      setMealType(mealOptions[0]?.value ?? '');
      setUnit(pickDefaultUnit(features?.inventoryUnits ?? []));

      if (!mealOptions.length) {
        log.warn('LogFood', 'No meal types returned for pet', {
          petId,
          species: features?.species,
        });
      }
      if (!unitOpts.length) {
        log.warn('LogFood', 'No inventory units returned for pet', {
          petId,
          species: features?.species,
        });
      }
    } catch (e) {
      setMealTypeOptions([]);
      setUnitOptions([]);
      setMealType('');
      setUnit('');
      setError(getErrorMessage(e));
      log.fail('LogFood', 'Load species features failed', getErrorMessage(e));
    } finally {
      setFeaturesLoading(false);
    }
  }, [petId, token]);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadSpeciesFeatures();
    }
  }, [visible, resetForm, loadSpeciesFeatures]);

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a feeding schedule.');
      return;
    }
    if (!mealType) {
      setError('Select a meal type.');
      return;
    }
    if (!unit) {
      setError('Select a unit.');
      return;
    }
    if (!amount.trim()) {
      setError('Enter an amount.');
      return;
    }

    const timeHHmm = dateToTimeHHmm(feedingTime);
    const noteText = notes.trim();

    setSaving(true);
    setError(null);
    try {
      await createFeedingSchedule(token, {
        petId,
        mealType,
        time: timeHHmm,
        amount: amount.trim(),
        unit,
        notes: noteText || undefined,
        reminder: notificationsOn,
        reminderMinutes: notificationsOn ? reminderMinutes : undefined,
        reminderTime: notificationsOn
          ? addMinutesToTimeHHmm(timeHHmm, reminderMinutes)
          : undefined,
      });
      log.ok('LogFood', 'Feeding schedule saved', { mealType, time: timeHHmm, unit });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title="Log Food"
        subtitle="Record a meal and set optional feeding reminders."
        icon={FOOD_THEME.icon}
        accentColor={FOOD_THEME.color}
        accentBg={FOOD_THEME.bg}
        saveLabel="Save Feeding"
        onSave={handleSave}
        saving={saving}
        saveDisabled={featuresLoading || !mealType || !unit}
        error={error}
      >
        <FormSection
          title="Meal details"
          icon="bowl-mix-outline"
          accentColor={FOOD_THEME.color}
          accentBg={FOOD_THEME.bg}
        >
          <FormSectionLabel text="MEAL TYPE" />
          {featuresLoading ? (
            <ActivityIndicator color={FOOD_THEME.color} style={{ marginBottom: 12 }} />
          ) : mealTypeOptions.length === 0 ? (
            <AppText variant="bodySmall" color={HomeTheme.textMuted} style={{ marginBottom: 12 }}>
              No meal types available for this pet.
            </AppText>
          ) : (
            <FormChipRow
              options={mealTypeOptions}
              selected={mealType}
              onSelect={setMealType}
              accentColor={FOOD_THEME.color}
            />
          )}

          <FormSectionLabel text="AMOUNT" />
          <FormTextField
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Enter portion amount"
          />

          <FormSectionLabel text="UNIT" />
          {featuresLoading ? (
            <ActivityIndicator color={FOOD_THEME.color} style={{ marginBottom: 12 }} />
          ) : unitOptions.length === 0 ? (
            <AppText variant="bodySmall" color={HomeTheme.textMuted}>
              No units available for this pet.
            </AppText>
          ) : (
            <FormChipRow
              options={unitOptions}
              selected={unit}
              onSelect={setUnit}
              accentColor={FOOD_THEME.color}
            />
          )}
        </FormSection>

        <FormSection
          title="Schedule & reminders"
          icon="calendar-clock"
          accentColor={FOOD_THEME.color}
          accentBg={FOOD_THEME.bg}
        >
          <View style={formSheetStyles.twoColRow}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="TIME" />
              <FormPickerField
                label={formatTimeDisplay(feedingTime)}
                icon="time-outline"
                onPress={() => setFeedingTimePickerVisible(true)}
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="NOTIFY" />
              <FormSwitchRow
                label="Remind me"
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                accentColor={FOOD_THEME.color}
              />
            </View>
          </View>
          {notificationsOn ? (
            <>
              <FormSectionLabel text="REMINDER" />
              <FormPickerField
                label={getReminderMinutesLabel(reminderMinutes)}
                icon="chevron-down"
                onPress={() => setReminderPickerVisible(true)}
              />
            </>
          ) : null}
        </FormSection>

        <FormSection title="Notes" icon="text-box-outline" accentColor={FOOD_THEME.color} accentBg={FOOD_THEME.bg}>
          <FormTextField
            value={notes}
            onChangeText={setNotes}
            placeholder="Extra details about this meal..."
            multiline
          />
        </FormSection>
      </FormSheetShell>

      <SheetOptionPicker
        visible={reminderPickerVisible}
        title="Remind me after"
        options={REMINDER_MINUTES_PICKER_OPTIONS}
        selectedValue={String(reminderMinutes)}
        onClose={() => setReminderPickerVisible(false)}
        onSelect={(value) => setReminderMinutes(Number(value))}
      />

      <ThemedTimePicker
        visible={feedingTimePickerVisible}
        value={feedingTime}
        onClose={() => setFeedingTimePickerVisible(false)}
        onConfirm={(date) => {
          setFeedingTime(date);
          setFeedingTimePickerVisible(false);
        }}
      />
    </>
  );
}
