import { getErrorMessage } from '@/lib/api/errors';
import {
  dateToApiDateString,
  defaultScheduledDate,
  formatDateLabel,
} from '@/lib/grooming/groomingForm';
import { log } from '@/lib/log';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import { createGroomingRecord, fetchGroomingTypes } from '@/services/grooming/groomingApi';
import type { GroomingTypeOption } from '@/types/grooming';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import {
  FormChipRow,
  FormPickerField,
  FormSection,
  FormSectionLabel,
  FormSheetShell,
  FormSwitchRow,
  FormTextField,
  formSheetStyles,
} from '../sheets';
import { ThemedDatePicker } from '../pet/ThemedDatePicker';
import { AppText } from '../ui/AppText';
import { HomeTheme } from '../../constants/theme';

const GROOMING_THEME = LOG_SHEET_THEMES.grooming;

interface LogGroomingSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
}

export function LogGroomingSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
}: LogGroomingSheetProps) {
  const [typeOptions, setTypeOptions] = useState<GroomingTypeOption[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [groomingType, setGroomingType] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [reminderOn, setReminderOn] = useState(true);
  const [notes, setNotes] = useState('');
  const [scheduledPickerVisible, setScheduledPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    if (!petId || !token) {
      setTypeOptions([]);
      setGroomingVisible(true);
      return;
    }
    setLoadingTypes(true);
    setError(null);
    try {
      const data = await fetchGroomingTypes(token, petId);
      setGroomingVisible(data.groomingVisible);
      setTypeOptions(data.types ?? []);
      setGroomingType(data.types?.[0]?.value ?? '');
    } catch (e) {
      setTypeOptions([]);
      setError(getErrorMessage(e));
    } finally {
      setLoadingTypes(false);
    }
  }, [petId, token]);

  const resetForm = useCallback(() => {
    setScheduledDate(defaultScheduledDate());
    setReminderOn(true);
    setNotes('');
    setError(null);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadTypes();
    }
  }, [visible, resetForm, loadTypes]);

  const handleSave = async () => {
    if (!petId || !token) {
      setError('Add a pet before saving a grooming task.');
      return;
    }
    if (!groomingVisible) {
      setError('Grooming is not available for this pet species.');
      return;
    }
    if (!groomingType) {
      setError('Select a grooming type.');
      return;
    }

    const noteText = notes.trim();

    setSaving(true);
    setError(null);
    try {
      await createGroomingRecord(token, {
        petId,
        type: groomingType,
        scheduledDate: scheduledDate ? dateToApiDateString(scheduledDate) : undefined,
        reminder: reminderOn,
        notes: noteText || undefined,
      });
      log.ok('LogGrooming', 'Grooming record saved', {
        type: groomingType,
        scheduledDate: scheduledDate ? dateToApiDateString(scheduledDate) : null,
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
        title="Log Grooming"
        subtitle="Schedule a grooming task and set reminders."
        icon={GROOMING_THEME.icon}
        accentColor={GROOMING_THEME.color}
        accentBg={GROOMING_THEME.bg}
        saveLabel="Save Grooming"
        onSave={handleSave}
        saving={saving}
        saveDisabled={loadingTypes || !groomingVisible || !groomingType}
        error={error}
      >
        {loadingTypes ? (
          <ActivityIndicator color={GROOMING_THEME.color} style={{ marginVertical: 24 }} />
        ) : !groomingVisible ? (
          <AppText variant="bodySmall" color={HomeTheme.textMuted} style={{ marginVertical: 12 }}>
            Grooming is not available for this pet species.
          </AppText>
        ) : (
          <>
            <FormSection
              title="Task details"
              icon="content-cut"
              accentColor={GROOMING_THEME.color}
              accentBg={GROOMING_THEME.bg}
            >
              <FormSectionLabel text="TASK TYPE" />
              <FormChipRow
                options={typeOptions.map((o) => ({ value: o.value, label: o.label }))}
                selected={groomingType}
                onSelect={setGroomingType}
                accentColor={GROOMING_THEME.color}
              />

              <FormSectionLabel text="SCHEDULED DATE" />
              <FormPickerField
                label={scheduledDate ? formatDateLabel(scheduledDate) : 'Tap to pick a date'}
                icon="calendar-outline"
                onPress={() => setScheduledPickerVisible(true)}
              />
            </FormSection>

            <FormSection
              title="Reminders"
              icon="bell-outline"
              accentColor={GROOMING_THEME.color}
              accentBg={GROOMING_THEME.bg}
            >
              <FormSwitchRow
                label="Remind me before appointment"
                value={reminderOn}
                onValueChange={setReminderOn}
                accentColor={GROOMING_THEME.color}
              />
            </FormSection>

            <FormSection
              title="Notes"
              icon="text-box-outline"
              accentColor={GROOMING_THEME.color}
              accentBg={GROOMING_THEME.bg}
            >
              <FormTextField
                value={notes}
                onChangeText={setNotes}
                placeholder="Specific instructions..."
                multiline
              />
            </FormSection>
          </>
        )}
      </FormSheetShell>

      <ThemedDatePicker
        visible={scheduledPickerVisible}
        title="Scheduled date"
        value={scheduledDate ?? defaultScheduledDate()}
        onClose={() => setScheduledPickerVisible(false)}
        onConfirm={(date) => {
          setScheduledDate(date);
          setScheduledPickerVisible(false);
        }}
      />
    </>
  );
}
