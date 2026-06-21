import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  FormChipRow,
  FormPickerField,
  FormSection,
  FormSectionLabel,
  FormSheetShell,
  FormSwitchRow,
  FormTextField,
  ThemedTimePicker,
  formSheetStyles,
} from '../sheets';
import { AppText } from '../ui/AppText';
import { HomeTheme } from '../../constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { formatTimeDisplay } from '@/lib/feeding/feedingForm';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  buildVaccinationDatePayload,
  createDefaultScheduleDate,
  validateScheduleDate,
  type ScheduleDateState,
} from '@/lib/schedule/scheduleDate';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { SkeletonList } from '@/components/ui/skeletons';
import {
  dateToTimeHHmm,
  defaultDueDate,
  defaultReminderTimeDate,
  VACCINATION_RECURRENCE_OPTIONS,
  VACCINATION_REMINDER_FREQUENCY_OPTIONS,
} from '@/lib/vaccination/vaccinationForm';
import { createVaccinationSchedule, fetchVaccinationHistory } from '@/services/schedules/vaccinationApi';
import type {
  VaccinationHistoryItem,
  VaccinationRecurrenceInterval,
  VaccinationReminderFrequency,
} from '@/types/vaccination';

const VACCINATION_THEME = LOG_SHEET_THEMES.vaccination;

interface LogVaccinationSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

export function LogVaccinationSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogVaccinationSheetProps) {
  const [vaccineName, setVaccineName] = useState('');
  const [scheduleDate, setScheduleDate] = useState<ScheduleDateState>(() => ({
    ...createDefaultScheduleDate('single'),
    singleDate: defaultDueDate(),
  }));
  const [reminderOn, setReminderOn] = useState(true);
  const [frequency, setFrequency] = useState<VaccinationReminderFrequency>('7_days');
  const [reminderTime, setReminderTime] = useState<Date>(() => defaultReminderTimeDate());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] =
    useState<VaccinationRecurrenceInterval>('yearly');
  const [notes, setNotes] = useState('');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<VaccinationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!petId || !token) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const rows = await fetchVaccinationHistory(token, petId);
      setHistory(rows.slice(0, 5));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [petId, token]);

  const resetForm = useCallback(() => {
    setVaccineName('');
    setScheduleDate({ ...createDefaultScheduleDate('single'), singleDate: defaultDueDate() });
    setReminderOn(true);
    setFrequency('7_days');
    setReminderTime(defaultReminderTimeDate());
    setIsRecurring(false);
    setRecurrenceInterval('yearly');
    setNotes('');
    setError(null);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadHistory();
    }
  }, [visible, resetForm, loadHistory]);

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a vaccination.');
      return;
    }
    if (!vaccineName.trim()) {
      setError('Enter a vaccine name.');
      return;
    }
    const dateError = validateScheduleDate(scheduleDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    const noteText = notes.trim();
    const datePayload = buildVaccinationDatePayload(scheduleDate);

    setSaving(true);
    setError(null);
    try {
      await createVaccinationSchedule(token, {
        petId,
        vaccineName: vaccineName.trim(),
        dueDate: datePayload.dueDate ?? datePayload.date ?? datePayload.startDate ?? '',
        ...datePayload,
        reminder: reminderOn,
        frequency,
        reminderTime: dateToTimeHHmm(reminderTime),
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        notes: noteText || undefined,
      });
      log.ok('LogVaccination', 'Vaccination schedule saved', {
        vaccineName: vaccineName.trim(),
      });
      onSaved?.();
      await loadHistory();
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
        title="Log Vaccination"
        icon={VACCINATION_THEME.icon}
        accentColor={VACCINATION_THEME.color}
        accentBg={VACCINATION_THEME.bg}
        saveLabel="Save Vaccination"
        onSave={handleSave}
        saving={saving}
        saveDisabled={!vaccineName.trim()}
        error={error}
        compact
      >
        <FormSection
          title="Vaccine details"
          icon="needle"
          accentColor={VACCINATION_THEME.color}
          accentBg={VACCINATION_THEME.bg}
        >
          <FormSectionLabel text="VACCINE NAME" />
          <FormTextField
            value={vaccineName}
            onChangeText={setVaccineName}
            placeholder="e.g. Rabies, DHPP, Bordetella"
          />

        </FormSection>

        <FormSection
          title="Schedule dates"
          icon="calendar-clock"
          accentColor={VACCINATION_THEME.color}
          accentBg={VACCINATION_THEME.bg}
        >
          <ScheduleDateFields
            value={scheduleDate}
            onChange={setScheduleDate}
            accentColor={VACCINATION_THEME.color}
          />
        </FormSection>

        <FormSection
          title="Reminders"
          icon="bell-outline"
          accentColor={VACCINATION_THEME.color}
          accentBg={VACCINATION_THEME.bg}
        >
          <FormSwitchRow
            label="Send vaccination reminders"
            value={reminderOn}
            onValueChange={setReminderOn}
            accentColor={VACCINATION_THEME.color}
          />

          {reminderOn ? (
            <>
              <FormSectionLabel text="REMIND ME" />
              <FormChipRow
                options={VACCINATION_REMINDER_FREQUENCY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                selected={frequency}
                onSelect={(value) => setFrequency(value as VaccinationReminderFrequency)}
                accentColor={VACCINATION_THEME.color}
              />

              <FormSectionLabel text="REMINDER TIME" />
              <FormPickerField
                label={formatTimeDisplay(reminderTime)}
                icon="time-outline"
                onPress={() => setTimePickerVisible(true)}
              />
            </>
          ) : null}
        </FormSection>

        <FormSection
          title="Recurrence"
          icon="repeat"
          accentColor={VACCINATION_THEME.color}
          accentBg={VACCINATION_THEME.bg}
        >
          <FormSwitchRow
            label="Repeats automatically"
            value={isRecurring}
            onValueChange={setIsRecurring}
            accentColor={VACCINATION_THEME.color}
          />

          {isRecurring ? (
            <>
              <FormSectionLabel text="REPEAT EVERY" />
              <FormChipRow
                options={VACCINATION_RECURRENCE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                selected={recurrenceInterval}
                onSelect={(value) => setRecurrenceInterval(value as VaccinationRecurrenceInterval)}
                accentColor={VACCINATION_THEME.color}
              />
            </>
          ) : null}
        </FormSection>

        <FormSection
          title="Notes"
          icon="text-box-outline"
          accentColor={VACCINATION_THEME.color}
          accentBg={VACCINATION_THEME.bg}
        >
          <FormTextField
            value={notes}
            onChangeText={setNotes}
            placeholder="Clinic, batch number, instructions..."
            multiline
          />
        </FormSection>

        <FormSection
          title="Vaccination history"
          icon="history"
          accentColor={VACCINATION_THEME.color}
          accentBg={VACCINATION_THEME.bg}
        >
          {historyLoading ? (
            <SkeletonList count={2} />
          ) : history.length === 0 ? (
            <AppText variant="bodySmall" color={HomeTheme.textMuted}>
              No completed vaccinations yet.
            </AppText>
          ) : (
            history.map((item, index) => (
              <View key={`${item.vaccineName}-${item.administeredDate}-${index}`} style={formSheetStyles.historyRow}>
                <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
                  {item.vaccineName}
                </AppText>
                <AppText variant="caption" color={HomeTheme.textMuted}>
                  {new Date(item.administeredDate).toLocaleDateString()}
                  {item.vetName ? ` · ${item.vetName}` : ''}
                </AppText>
              </View>
            ))
          )}
        </FormSection>
      </FormSheetShell>

      <ThemedTimePicker
        visible={timePickerVisible}
        value={reminderTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          setReminderTime(date);
          setTimePickerVisible(false);
        }}
      />
    </>
  );
}
