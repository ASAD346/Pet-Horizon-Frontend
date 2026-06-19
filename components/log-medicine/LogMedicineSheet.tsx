import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
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
import { ThemedDatePicker } from '../pet/ThemedDatePicker';
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
  buildDoseString,
  dateToApiDateString,
  dateToTimeHHmm,
  DAYS_OF_WEEK_OPTIONS,
  defaultMedicineTimeDate,
  DOSE_FORM_OPTIONS,
  formatDateLabel,
  formatTimeDisplay,
  FREQUENCY_OPTIONS,
  isStartBeforeOrEqualEnd,
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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [totalPills, setTotalPills] = useState('30');
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(DEFAULT_REMINDER_MINUTES);
  const [notes, setNotes] = useState('');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);
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
    setStartDate(null);
    setEndDate(null);
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

    if (startDate && endDate && !isStartBeforeOrEqualEnd(startDate, endDate)) {
      setError('Start date must be before or equal to end date.');
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
        startDate: startDate ? dateToApiDateString(startDate) : undefined,
        endDate: endDate ? dateToApiDateString(endDate) : undefined,
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
        subtitle="Track doses, frequency, and refill reminders."
        icon={MEDICINE_THEME.icon}
        accentColor={MEDICINE_THEME.color}
        accentBg={MEDICINE_THEME.bg}
        saveLabel="Save Medicine"
        onSave={handleSave}
        saving={saving}
        error={error}
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
          <FormPickerField
            label={formatTimeDisplay(medicineTime)}
            icon="time-outline"
            onPress={() => setTimePickerVisible(true)}
          />

          <View style={formSheetStyles.twoColRow}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="START DATE" />
              <FormPickerField
                label={startDate ? formatDateLabel(startDate) : 'Not set'}
                icon="calendar-outline"
                onPress={() => setStartDatePickerVisible(true)}
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="END DATE" />
              <FormPickerField
                label={endDate ? formatDateLabel(endDate) : 'Not set'}
                icon="calendar-outline"
                onPress={() => setEndDatePickerVisible(true)}
              />
            </View>
          </View>
        </FormSection>

        <FormSection
          title="Reminders & notes"
          icon="bell-outline"
          accentColor={MEDICINE_THEME.color}
          accentBg={MEDICINE_THEME.bg}
        >
          <FormSwitchRow
            label="Remind me to give medicine"
            value={reminderOn}
            onValueChange={setReminderOn}
            accentColor={MEDICINE_THEME.color}
          />
          {reminderOn ? (
            <>
              <FormSectionLabel text="REMINDER TIMING" />
              <FormPickerField
                label={getReminderMinutesLabel(reminderMinutes)}
                icon="chevron-down"
                onPress={() => setReminderPickerVisible(true)}
              />
            </>
          ) : null}

          <FormSectionLabel text="NOTES" />
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

      <ThemedDatePicker
        visible={startDatePickerVisible}
        title="Start date"
        value={startDate ?? new Date()}
        maximumDate={endDate ?? undefined}
        onClose={() => setStartDatePickerVisible(false)}
        onConfirm={(date) => {
          setStartDate(date);
          if (endDate && !isStartBeforeOrEqualEnd(date, endDate)) {
            setEndDate(null);
          }
          setStartDatePickerVisible(false);
        }}
      />

      <ThemedDatePicker
        visible={endDatePickerVisible}
        title="End date"
        value={endDate ?? startDate ?? new Date()}
        minimumDate={startDate ?? undefined}
        onClose={() => setEndDatePickerVisible(false)}
        onConfirm={(date) => {
          setEndDate(date);
          setEndDatePickerVisible(false);
        }}
      />
    </>
  );
}
