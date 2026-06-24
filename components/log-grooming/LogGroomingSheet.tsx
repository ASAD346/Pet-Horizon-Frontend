import { getErrorMessage } from '@/lib/api/errors';
import {
  defaultScheduledDate,
} from '@/lib/grooming/groomingForm';
import { log } from '@/lib/log';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  buildGroomingDatePayload,
  createDefaultScheduleDate,
  validateScheduleDate,
  type ScheduleDateState,
} from '@/lib/schedule/scheduleDate';
import { ScheduleDateFields } from '@/components/schedule/ScheduleDateFields';
import { createGroomingRecord, fetchGroomingTypes } from '@/services/grooming/groomingApi';
import type { GroomingTypeOption } from '@/types/grooming';
import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { SkeletonChipGrid } from '@/components/ui/skeletons';
import {
  FormChipRow,
  FormSection,
  FormSectionLabel,
  FormSheetShell,
  FormSwitchRow,
  FormTextField,
  formSheetStyles,
} from '../sheets';
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
  const [scheduleDate, setScheduleDate] = useState<ScheduleDateState>(() => ({
    ...createDefaultScheduleDate('single'),
    singleDate: defaultScheduledDate(),
  }));
  const [reminderOn, setReminderOn] = useState(true);
  const [notes, setNotes] = useState('');
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
    setScheduleDate({ ...createDefaultScheduleDate('single'), singleDate: defaultScheduledDate() });
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

  const { showToast } = useToast();

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
    const dateError = validateScheduleDate(scheduleDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    const noteText = notes.trim();
    const datePayload = buildGroomingDatePayload(scheduleDate);

    setSaving(true);
    setError(null);
    try {
      await createGroomingRecord(token, {
        petId,
        type: groomingType,
        ...datePayload,
        reminder: reminderOn,
        notes: noteText || undefined,
      });
      log.ok('LogGrooming', 'Grooming record saved', {
        type: groomingType,
      });
      showToast('Grooming logged successfully!');
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
        icon={GROOMING_THEME.icon}
        accentColor={GROOMING_THEME.color}
        accentBg={GROOMING_THEME.bg}
        saveLabel="Save Grooming"
        onSave={handleSave}
        saving={saving}
        saveDisabled={loadingTypes || !groomingVisible || !groomingType}
        error={error}
        compact
      >
        {loadingTypes ? (
          <SkeletonChipGrid count={4} />
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

            </FormSection>

            <FormSection
              title="Schedule dates"
              icon="calendar-clock"
              accentColor={GROOMING_THEME.color}
              accentBg={GROOMING_THEME.bg}
            >
              <ScheduleDateFields
                value={scheduleDate}
                onChange={setScheduleDate}
                accentColor={GROOMING_THEME.color}
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
                icon="notifications-outline"
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
    </>
  );
}
