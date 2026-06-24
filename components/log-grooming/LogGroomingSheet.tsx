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
} from '@/lib/schedule/scheduleDate';
import { createGroomingRecord, fetchGroomingTypes } from '@/services/grooming/groomingApi';
import type { GroomingTypeOption } from '@/types/grooming';
import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { SkeletonChipGrid } from '@/components/ui/skeletons';
import { FormSheetShell } from '../sheets';
import { AppText } from '../ui/AppText';
import { HomeTheme } from '../../constants/theme';
import { GroomingEntryCard } from '../schedule/entries/GroomingEntryCard';
import type { GroomingEntryState } from '@/lib/schedule/types';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';

const GROOMING_THEME = LOG_SHEET_THEMES.grooming;

interface LogGroomingSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
  initialEntry?: GroomingEntryState | null;
}

export function LogGroomingSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
  initialEntry,
}: LogGroomingSheetProps) {
  const [typeOptions, setTypeOptions] = useState<GroomingTypeOption[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [entry, setEntry] = useState<GroomingEntryState>(() => initialEntry ?? {
    id: 'draft',
    groomingType: '',
    scheduleDate: {
      ...createDefaultScheduleDate('single'),
      singleDate: defaultScheduledDate(),
    },
    reminderOn: true,
    notes: '',
  });
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
      setEntry((prev) => ({
        ...prev,
        groomingType: prev.groomingType || (data.types?.[0]?.value ?? ''),
      }));
    } catch (e) {
      setTypeOptions([]);
      setError(getErrorMessage(e));
    } finally {
      setLoadingTypes(false);
    }
  }, [petId, token]);

  const resetForm = useCallback(() => {
    if (initialEntry) {
      setEntry({ ...initialEntry });
    } else {
      setEntry({
        id: 'draft',
        groomingType: '',
        scheduleDate: { ...createDefaultScheduleDate('single'), singleDate: defaultScheduledDate() },
        reminderOn: true,
        notes: '',
      });
    }
    setError(null);
  }, [initialEntry]);

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
    if (!entry.groomingType) {
      setError('Select a grooming type.');
      return;
    }
    const dateError = validateScheduleDate(entry.scheduleDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveScheduleEntry(token, petId, 'grooming', entry, { groomingVisible });
      const isEdit = Boolean(entry.recordId);
      log.ok('LogGrooming', isEdit ? 'Grooming record updated' : 'Grooming record saved', {
        type: entry.groomingType,
      });
      showToast(isEdit ? 'Grooming schedule updated successfully!' : 'Grooming logged successfully!');
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
      title={entry.recordId ? 'Edit Grooming' : 'Log Grooming'}
      icon={GROOMING_THEME.icon}
      accentColor={GROOMING_THEME.color}
      accentBg={GROOMING_THEME.bg}
      saveLabel={entry.recordId ? 'Save Changes' : 'Save Grooming'}
      onSave={handleSave}
      saving={saving}
      saveDisabled={loadingTypes || !groomingVisible || !entry.groomingType}
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
        <GroomingEntryCard
          entry={entry}
          index={0}
          accentColor={GROOMING_THEME.color}
          accentBg={GROOMING_THEME.bg}
          typeOptions={typeOptions}
          canRemove={false}
          embeddedInSheet
          onChange={setEntry}
          onRemove={() => {}}
        />
      )}
    </FormSheetShell>
  );
}
