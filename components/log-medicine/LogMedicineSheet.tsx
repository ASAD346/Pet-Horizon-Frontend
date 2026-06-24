import React, { useCallback, useEffect, useState } from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { useToast } from '@/hooks/useToast';
import {
  FormChipRow,
  FormMultiChipRow,
  FormPickerField,
  FormSection,
  FormSectionLabel,
  FormSheetShell,
  FormSuffixInput,
  FormSwitchRow,
  FormTextField,
  SheetOptionPicker,
  ThemedTimePicker,
  formSheetStyles,
} from '../sheets';
import type { SheetOption } from '../sheets';
import { HomeTheme, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  addMinutesToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  buildScheduleDatePayload,
  createDefaultScheduleDate,
  validateScheduleDate,
  type ScheduleDateState,
} from '@/lib/schedule/scheduleDate';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import {
  buildDoseString,
  dateToTimeHHmm,
  DAYS_OF_WEEK_OPTIONS,
  defaultMedicineTimeDate,
  DOSE_FORM_OPTIONS,
  formatTimeDisplay,
  FREQUENCY_OPTIONS,
  parseTotalPills,
} from '@/lib/medicine/medicineForm';
import { createMedicineSchedule } from '@/services/schedules/medicineApi';
import type { DayOfWeekCode, MedicineDoseForm, MedicineFrequency } from '@/types/medicine';

const REMINDER_MINUTES_PICKER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

const MEDICINE_THEME = LOG_SHEET_THEMES.medicine;

interface LogMedicineSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

export function LogMedicineSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogMedicineSheetProps) {
  const [medicineName, setMedicineName] = useState('');
  const [doseAmount, setDoseAmount] = useState('1');
  const [doseForm, setDoseForm] = useState<MedicineDoseForm>('tablet');
  const [frequency, setFrequency] = useState<MedicineFrequency>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeekCode[]>([]);
  const [medicineTime, setMedicineTime] = useState(defaultMedicineTimeDate);
  const [scheduleDate, setScheduleDate] = useState<ScheduleDateState>(createDefaultScheduleDate('ongoing'));
  const [totalPills, setTotalPills] = useState('30');
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(DEFAULT_REMINDER_MINUTES);
  const [notes, setNotes] = useState('');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setMedicineName('');
    setDoseAmount('1');
    setDoseForm('tablet');
    setFrequency('daily');
    setDaysOfWeek([]);
    setMedicineTime(defaultMedicineTimeDate());
    setScheduleDate(createDefaultScheduleDate('ongoing'));
    setTotalPills('30');
    setReminderOn(true);
    setReminderMinutes(DEFAULT_REMINDER_MINUTES);
    setNotes('');
    setError(null);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const toggleDay = (day: DayOfWeekCode) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const { showToast } = useToast();

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a medicine schedule.');
      return;
    }

    const name = medicineName.trim();
    if (!name) {
      setError('Enter a medicine name.');
      return;
    }

    const dose = buildDoseString(doseAmount, doseForm);
    if (!dose) {
      setError('Enter a valid dose amount.');
      return;
    }

    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      setError('Select at least one day for a weekly schedule.');
      return;
    }

    const dateError = validateScheduleDate(scheduleDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    const pills = parseTotalPills(totalPills);
    if (pills === null) {
      setError('Enter a valid total quantity.');
      return;
    }

    const timeHHmm = dateToTimeHHmm(medicineTime);
    const noteText = notes.trim();

    setSaving(true);
    setError(null);
    try {
      await createMedicineSchedule(token, {
        petId,
        medicineName: name,
        dose,
        time: timeHHmm,
        doseForm,
        frequency,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
        totalPills: pills,
        remainingPills: pills,
        notes: noteText || undefined,
        ...buildScheduleDatePayload(scheduleDate),
        reminder: reminderOn,
        reminderMinutes: reminderOn ? reminderMinutes : undefined,
        reminderTime: reminderOn ? addMinutesToTimeHHmm(timeHHmm, reminderMinutes) : undefined,
      });
      log.ok('LogMedicine', 'Medicine schedule saved', {
        medicineName: name,
        dose,
        time: timeHHmm,
        frequency,
      });
      showToast('Medicine logged successfully!');
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
        title="Log Medicine"
        icon={MEDICINE_THEME.icon}
        accentColor={MEDICINE_THEME.color}
        accentBg={MEDICINE_THEME.bg}
        saveLabel="Save Medicine"
        onSave={handleSave}
        saving={saving}
        error={error}
        compact
      >
        <FormSection
          title="Medicine info"
          icon="pill"
          accentColor={MEDICINE_THEME.color}
          accentBg={MEDICINE_THEME.bg}
        >
          <FormSectionLabel text="MEDICINE NAME" />
          <FormTextField
            value={medicineName}
            onChangeText={setMedicineName}
            placeholder="e.g. Heartgard"
          />

          <View style={formSheetStyles.twoColRow}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="DOSE AMOUNT" />
              <FormSuffixInput
                value={doseAmount}
                onChangeText={setDoseAmount}
                suffix={doseForm === 'tablet' ? 'qty' : 'ml'}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="DOSE FORM" />
              <FormChipRow
                options={DOSE_FORM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                selected={doseForm}
                onSelect={(value) => setDoseForm(value as MedicineDoseForm)}
                accentColor={MEDICINE_THEME.color}
              />
            </View>
          </View>

          <FormSectionLabel text="TOTAL QUANTITY" />
          <FormSuffixInput
            value={totalPills}
            onChangeText={setTotalPills}
            suffix="pills"
            keyboardType="number-pad"
            placeholder="30"
          />
        </FormSection>

        <FormSection
          title="Schedule"
          icon="calendar-clock"
          accentColor={MEDICINE_THEME.color}
          accentBg={MEDICINE_THEME.bg}
        >
          <FormSectionLabel text="FREQUENCY" />
          <FormChipRow
            options={FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selected={frequency}
            onSelect={(value) => {
              setFrequency(value as MedicineFrequency);
              if (value !== 'weekly') setDaysOfWeek([]);
            }}
            accentColor={MEDICINE_THEME.color}
          />

          {frequency === 'weekly' ? (
            <>
              <FormSectionLabel text="DAYS OF WEEK" />
              <FormMultiChipRow
                options={DAYS_OF_WEEK_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                selected={daysOfWeek}
                onToggle={(value) => toggleDay(value as DayOfWeekCode)}
                accentColor={MEDICINE_THEME.color}
              />
            </>
          ) : null}

          <FormSectionLabel text="TIME" />
          <View style={[formSheetStyles.twoColRow, { marginBottom: Spacing.sm }]}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="TIME" />
              <FormPickerField
                label={formatTimeDisplay(medicineTime)}
                icon="time-outline"
                onPress={() => setTimePickerVisible(true)}
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="NOTIFICATIONS" />
              <View style={[formSheetStyles.switchRow, styles.switchContainer]}>
                <AppText variant="bodySmall" weight="600" color={HomeTheme.text}>
                  Remind me
                </AppText>
                <Switch
                  value={reminderOn}
                  onValueChange={setReminderOn}
                  trackColor={{ false: '#E2E8F0', true: MEDICINE_THEME.color }}
                  thumbColor={HomeTheme.white}
                  ios_backgroundColor="#E2E8F0"
                />
              </View>
            </View>
          </View>

          <ScheduleDateFields
            value={scheduleDate}
            onChange={setScheduleDate}
            accentColor={MEDICINE_THEME.color}
          />

          {reminderOn ? (
            <View style={{ marginBottom: Spacing.sm }}>
              <FormSectionLabel text="REMINDER DELAY" />
              <FormPickerField
                label={getReminderMinutesLabel(reminderMinutes)}
                icon="notifications-outline"
                onPress={() => setReminderPickerVisible(true)}
              />
            </View>
          ) : null}
        </FormSection>

        <FormSection
          title="Notes"
          icon="text-box-outline"
          accentColor={MEDICINE_THEME.color}
          accentBg={MEDICINE_THEME.bg}
        >
          <FormTextField
            value={notes}
            onChangeText={setNotes}
            placeholder="With food, vet instructions..."
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
        visible={timePickerVisible}
        value={medicineTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          setMedicineTime(date);
          setTimePickerVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    minHeight: 44,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
});
