import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  DEFAULT_REMINDER_MINUTES,
} from '@/lib/feeding/feedingForm';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  dateToTimeHHmm,
  defaultWalkTimeDate,
  parseDurationMinutes,
  WALK_TIME_OPTIONS,
} from '@/lib/walk/walkForm';
import {
  createDefaultScheduleDate,
  validateScheduleDate,
} from '@/lib/schedule/scheduleDate';
import { FormSheetShell } from '../sheets';
import { WalkEntryCard } from '../schedule/entries/WalkEntryCard';
import type { WalkEntryState } from '@/lib/schedule/types';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';

const WALK_THEME = LOG_SHEET_THEMES.walk;

interface LogWalkSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
  initialEntry?: WalkEntryState | null;
}

export function LogWalkSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
  initialEntry,
}: LogWalkSheetProps) {
  const [entry, setEntry] = useState<WalkEntryState>(() => ({
    id: 'draft',
    walkTime: WALK_TIME_OPTIONS[0].value,
    duration: '45',
    walkClockTime: defaultWalkTimeDate(),
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
        walkTime: WALK_TIME_OPTIONS[0].value,
        duration: '45',
        walkClockTime: defaultWalkTimeDate(),
        scheduleDate: createDefaultScheduleDate('ongoing'),
        reminderMinutes: DEFAULT_REMINDER_MINUTES,
        notificationsOn: true,
        notes: '',
      });
    }
    setError(null);
  }, [initialEntry]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const { showToast } = useToast();

  const handleSave = async () => {
    if (saving) return;
    if (!petId || !token) {
      setError('Add a pet before saving a walk schedule.');
      return;
    }

    const durationMinutes = parseDurationMinutes(entry.duration);
    if (durationMinutes === null) {
      setError('Enter a valid duration in minutes.');
      return;
    }
    const dateError = validateScheduleDate(entry.scheduleDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    const timeHHmm = dateToTimeHHmm(entry.walkClockTime);

    setSaving(true);
    setError(null);
    try {
      await saveScheduleEntry(token, petId, 'walk', entry);
      const isEdit = Boolean(entry.scheduleId);
      log.ok('LogWalk', isEdit ? 'Walk schedule updated' : 'Walk schedule saved', { walkTime: entry.walkTime, time: timeHHmm, duration: durationMinutes });
      showToast(isEdit ? 'Walk schedule updated successfully!' : 'Walk logged successfully!');
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
      title={entry.scheduleId ? 'Edit Walk' : 'Log Walk'}
      icon={WALK_THEME.icon}
      accentColor={WALK_THEME.color}
      accentBg={WALK_THEME.bg}
      saveLabel={entry.scheduleId ? 'Save Changes' : 'Save Walk'}
      onSave={handleSave}
      saving={saving}
      error={error}
      compact
    >
      <WalkEntryCard
        entry={entry}
        index={0}
        accentColor={WALK_THEME.color}
        accentBg={WALK_THEME.bg}
        canRemove={false}
        embeddedInSheet
        onChange={setEntry}
        onRemove={() => {}}
      />
    </FormSheetShell>
  );
}
