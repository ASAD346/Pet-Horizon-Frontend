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
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Skeleton } from '@/components/ui/Skeleton';
import { View } from 'react-native';

const WALK_THEME = LOG_SHEET_THEMES.walk;

interface LogWalkSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
  initialEntry?: WalkEntryState | null;
  isReadOnly?: boolean;
}

export function LogWalkSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
  initialEntry,
  isReadOnly = false,
}: LogWalkSheetProps) {
  const { canEdit, loading: permissionsLoading } = usePermissionGuard(petId, 'walks');
  const resolvedReadOnly = isReadOnly || !canEdit;

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
  }, [initialEntry]);
  const [saving, setSaving] = useState(false);
  const { showToast, showErrorToast } = useToast();

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const handleSave = async () => {
    if (!canEdit) {
      showToast("Read-only access: You cannot modify this entry.");
      return;
    }
    if (saving || resolvedReadOnly) return;
    if (!petId || !token) {
      showErrorToast('Add a pet before saving a walk schedule.');
      return;
    }

    const durationMinutes = parseDurationMinutes(entry.duration);
    if (durationMinutes === null) {
      showErrorToast('Enter a valid duration in minutes.');
      return;
    }
    const dateError = validateScheduleDate(entry.scheduleDate);
    if (dateError) {
      showErrorToast(dateError);
      return;
    }

    const timeHHmm = dateToTimeHHmm(entry.walkClockTime);

    setSaving(true);
    try {
      await saveScheduleEntry(token, petId, 'walk', entry);
      const isEdit = Boolean(entry.scheduleId);
      log.ok('LogWalk', isEdit ? 'Walk schedule updated' : 'Walk schedule saved', { walkTime: entry.walkTime, time: timeHHmm, duration: durationMinutes });
      showToast(isEdit ? 'Walk schedule updated successfully!' : 'Walk logged successfully!');
      onSaved?.();
      onClose();
    } catch (e) {
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
        title={entry.scheduleId ? 'Edit Walk' : 'Log Walk'}
        icon={WALK_THEME.icon}
        accentColor={WALK_THEME.color}
        accentBg={WALK_THEME.bg}
        saveLabel={undefined}
        onSave={undefined}
        saving={false}
        error={null}
        isReadOnly={true}
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
      title={entry.scheduleId ? 'Edit Walk' : 'Log Walk'}
      icon={WALK_THEME.icon}
      accentColor={WALK_THEME.color}
      accentBg={WALK_THEME.bg}
      saveLabel={resolvedReadOnly ? undefined : (entry.scheduleId ? 'Save Changes' : 'Save Walk')}
      onSave={handleSave}
      saving={saving}
      isReadOnly={resolvedReadOnly}
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
