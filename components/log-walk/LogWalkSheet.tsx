import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  FormChipRow,
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
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  addMinutesToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  formatTimeDisplay,
  getReminderMinutesLabel,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  dateToTimeHHmm,
  defaultWalkTimeDate,
  parseDurationMinutes,
  WALK_TIME_OPTIONS,
} from '@/lib/walk/walkForm';
import { createWalkSchedule } from '@/services/schedules/walkApi';

const REMINDER_MINUTES_PICKER_OPTIONS: SheetOption[] = REMINDER_MINUTES_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

const WALK_THEME = LOG_SHEET_THEMES.walk;

interface LogWalkSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

export function LogWalkSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogWalkSheetProps) {
  const [walkTime, setWalkTime] = useState<string>(WALK_TIME_OPTIONS[0].value);
  const [duration, setDuration] = useState('45');
  const [walkClockTime, setWalkClockTime] = useState(defaultWalkTimeDate);
  const [reminderMinutes, setReminderMinutes] = useState(DEFAULT_REMINDER_MINUTES);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [notes, setNotes] = useState('');
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setWalkTime(WALK_TIME_OPTIONS[0].value);
    setDuration('45');
    setWalkClockTime(defaultWalkTimeDate());
    setReminderMinutes(DEFAULT_REMINDER_MINUTES);
    setNotificationsOn(true);
    setNotes('');
    setError(null);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a walk schedule.');
      return;
    }

    const durationMinutes = parseDurationMinutes(duration);
    if (durationMinutes === null) {
      setError('Enter a valid duration in minutes.');
      return;
    }

    const timeHHmm = dateToTimeHHmm(walkClockTime);
    const noteText = notes.trim();

    setSaving(true);
    setError(null);
    try {
      await createWalkSchedule(token, {
        petId,
        walkTime,
        time: timeHHmm,
        duration: durationMinutes,
        notes: noteText || undefined,
        reminder: notificationsOn,
        reminderMinutes: notificationsOn ? reminderMinutes : undefined,
        reminderTime: notificationsOn ? addMinutesToTimeHHmm(timeHHmm, reminderMinutes) : undefined,
      });
      log.ok('LogWalk', 'Walk schedule saved', { walkTime, time: timeHHmm, duration: durationMinutes });
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
        title="Log Walk"
        subtitle="Set a daily walk time and optional reminders."
        icon={WALK_THEME.icon}
        accentColor={WALK_THEME.color}
        accentBg={WALK_THEME.bg}
        saveLabel="Save Walk"
        onSave={handleSave}
        saving={saving}
        error={error}
      >
        <FormSection
          title="Walk details"
          icon="walk"
          accentColor={WALK_THEME.color}
          accentBg={WALK_THEME.bg}
        >
          <FormSectionLabel text="WHICH WALK?" />
          <FormChipRow
            options={WALK_TIME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selected={walkTime}
            onSelect={setWalkTime}
            accentColor={WALK_THEME.color}
          />

          <View style={formSheetStyles.twoColRow}>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="TIME" />
              <FormPickerField
                label={formatTimeDisplay(walkClockTime)}
                icon="time-outline"
                onPress={() => setTimePickerVisible(true)}
              />
            </View>
            <View style={formSheetStyles.halfCol}>
              <FormSectionLabel text="DURATION" />
              <FormSuffixInput
                value={duration}
                onChangeText={setDuration}
                suffix="min"
                keyboardType="number-pad"
                placeholder="45"
              />
            </View>
          </View>
        </FormSection>

        <FormSection
          title="Reminders"
          icon="bell-outline"
          accentColor={WALK_THEME.color}
          accentBg={WALK_THEME.bg}
        >
          <FormSwitchRow
            label="Remind me before walk"
            value={notificationsOn}
            onValueChange={setNotificationsOn}
            accentColor={WALK_THEME.color}
          />
          {notificationsOn ? (
            <>
              <FormSectionLabel text="REMINDER TIMING" />
              <FormPickerField
                label={getReminderMinutesLabel(reminderMinutes)}
                icon="chevron-down"
                onPress={() => setReminderPickerVisible(true)}
              />
            </>
          ) : null}
        </FormSection>

        <FormSection title="Notes" icon="text-box-outline" accentColor={WALK_THEME.color} accentBg={WALK_THEME.bg}>
          <FormTextField
            value={notes}
            onChangeText={setNotes}
            placeholder="Park route, leash preference..."
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
        value={walkClockTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(date) => {
          setWalkClockTime(date);
          setTimePickerVisible(false);
        }}
      />
    </>
  );
}
