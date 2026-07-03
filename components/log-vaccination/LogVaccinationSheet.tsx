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
  createDefaultScheduleDate,
  validateScheduleDate,
} from '@/lib/schedule/scheduleDate';
import { Skeleton, SkeletonList } from '@/components/ui/skeletons';
import {
  defaultDueDate,
  defaultReminderTimeDate,
} from '@/lib/vaccination/vaccinationForm';
import { fetchVaccinationHistory } from '@/services/schedules/vaccinationApi';
import type {
  VaccinationHistoryItem,
} from '@/types/vaccination';
import { VaccinationEntryCard } from '../schedule/entries/VaccinationEntryCard';
import type { VaccinationEntryState } from '@/lib/schedule/types';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const VACCINATION_THEME = LOG_SHEET_THEMES.vaccination;

interface LogVaccinationSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
  initialEntry?: VaccinationEntryState | null;
  isReadOnly?: boolean;
}

export function LogVaccinationSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
  initialEntry,
  isReadOnly = false,
}: LogVaccinationSheetProps) {
  const { canEdit, loading: permissionsLoading } = usePermissionGuard(petId, 'vaccination');
  const resolvedReadOnly = isReadOnly || !canEdit;

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
  const { showToast, showErrorToast } = useToast();
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
  }, [initialEntry]);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadHistory();
    }
  }, [visible, resetForm, loadHistory]);

  const handleSave = async () => {
    if (!canEdit) {
      showToast("Read-only access: You cannot modify this entry.");
      return;
    }
    if (saving || resolvedReadOnly) return;
    if (!petId || !token) {
      showErrorToast('Add a pet before saving a vaccination.');
      return;
    }
    if (!entry.vaccineName.trim()) {
      showErrorToast('Enter a vaccine name.');
      return;
    }
    const dateError = validateScheduleDate(entry.scheduleDate);
    if (dateError) {
      showErrorToast(dateError);
      return;
    }

    setSaving(true);
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
        title={entry.scheduleId ? 'Edit Vaccination' : 'Log Vaccination'}
        icon={VACCINATION_THEME.icon}
        accentColor={VACCINATION_THEME.color}
        accentBg={VACCINATION_THEME.bg}
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
      title={entry.scheduleId ? 'Edit Vaccination' : 'Log Vaccination'}
      icon={VACCINATION_THEME.icon}
      accentColor={VACCINATION_THEME.color}
      accentBg={VACCINATION_THEME.bg}
      saveLabel={resolvedReadOnly ? undefined : (entry.scheduleId ? 'Save Changes' : 'Save Vaccination')}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!entry.vaccineName.trim() || resolvedReadOnly}
      isReadOnly={resolvedReadOnly}
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
      {history.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <FormSection title="Recent History">
            {historyLoading ? (
              <SkeletonList count={2} />
            ) : (
              history.map((h, i) => (
                <View key={`${h.vaccineName}-${h.administeredDate}-${i}`} style={formSheetStyles.historyRow}>
                  <AppText variant="bodySmall" weight="700" color={HomeTheme.text}>
                    {h.vaccineName}
                  </AppText>
                  <AppText variant="caption" color={HomeTheme.textMuted}>
                    {new Date(h.administeredDate).toLocaleDateString()}
                    {h.vetName ? ` · ${h.vetName}` : ''}
                  </AppText>
                </View>
              ))
            )}
          </FormSection>
        </View>
      )}
    </FormSheetShell>
  );
}
