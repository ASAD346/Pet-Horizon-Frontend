import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useToast } from '@/hooks/useToast';
import { FormSection, FormSheetShell, formSheetStyles } from '../sheets';
import { AppText } from '../ui/AppText';
import { HomeTheme } from '../../constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  buildVaccinationDatePayload,
  createDefaultScheduleDate,
  validateScheduleDate,
} from '@/lib/schedule/scheduleDate';
import { SkeletonList } from '@/components/ui/skeletons';
import {
  dateToTimeHHmm,
  defaultDueDate,
  defaultReminderTimeDate,
} from '@/lib/vaccination/vaccinationForm';
import { createVaccinationSchedule, fetchVaccinationHistory } from '@/services/schedules/vaccinationApi';
import type {
  VaccinationHistoryItem,
} from '@/types/vaccination';
import { VaccinationEntryCard } from '../schedule/entries/VaccinationEntryCard';
import type { VaccinationEntryState } from '@/lib/schedule/types';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';

const VACCINATION_THEME = LOG_SHEET_THEMES.vaccination;

interface LogVaccinationSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
  initialEntry?: VaccinationEntryState | null;
}

export function LogVaccinationSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
  initialEntry,
}: LogVaccinationSheetProps) {
  const [entry, setEntry] = useState<VaccinationEntryState>(() => initialEntry ?? {
    id: 'draft',
    vaccineName: '',
    scheduleDate: {
      ...createDefaultScheduleDate('single'),
      singleDate: defaultDueDate(),
    },
    reminderOn: true,
    frequency: '7_days',
    reminderTime: defaultReminderTimeDate(),
    isRecurring: false,
    recurrenceInterval: 'yearly',
    notes: '',
  });

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
    if (initialEntry) {
      setEntry({ ...initialEntry });
    } else {
      setEntry({
        id: 'draft',
        vaccineName: '',
        scheduleDate: { ...createDefaultScheduleDate('single'), singleDate: defaultDueDate() },
        reminderOn: true,
        frequency: '7_days',
        reminderTime: defaultReminderTimeDate(),
        isRecurring: false,
        recurrenceInterval: 'yearly',
        notes: '',
      });
    }
    setError(null);
  }, [initialEntry]);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadHistory();
    }
  }, [visible, resetForm, loadHistory]);

  const { showToast } = useToast();

  const handleSave = async () => {
    if (saving) return;
    if (!petId || !token) {
      setError('Add a pet before saving a vaccination.');
      return;
    }
    if (!entry.vaccineName.trim()) {
      setError('Enter a vaccine name.');
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
      await saveScheduleEntry(token, petId, 'vaccination', entry);
      const isEdit = Boolean(entry.scheduleId);
      log.ok('LogVaccination', isEdit ? 'Vaccination schedule updated' : 'Vaccination schedule saved', {
        vaccineName: entry.vaccineName.trim(),
      });
      showToast(isEdit ? 'Vaccination schedule updated successfully!' : 'Vaccination logged successfully!');
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
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title={entry.scheduleId ? 'Edit Vaccination' : 'Log Vaccination'}
      icon={VACCINATION_THEME.icon}
      accentColor={VACCINATION_THEME.color}
      accentBg={VACCINATION_THEME.bg}
      saveLabel={entry.scheduleId ? 'Save Changes' : 'Save Vaccination'}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!entry.vaccineName.trim()}
      error={error}
      compact
    >
      <VaccinationEntryCard
        entry={entry}
        index={0}
        accentColor={VACCINATION_THEME.color}
        accentBg={VACCINATION_THEME.bg}
        canRemove={false}
        embeddedInSheet
        onChange={setEntry}
        onRemove={() => {}}
      />

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
  );
}
