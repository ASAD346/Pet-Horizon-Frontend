import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  DEFAULT_REMINDER_MINUTES,
} from '@/lib/feeding/feedingForm';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  createDefaultScheduleDate,
  validateScheduleDate,
} from '@/lib/schedule/scheduleDate';
import {
  buildDoseString,
  dateToTimeHHmm,
  defaultMedicineTimeDate,
  parseTotalPills,
} from '@/lib/medicine/medicineForm';
import { FormSheetShell } from '../sheets';
import { MedicineEntryCard } from '../schedule/entries/MedicineEntryCard';
import type { MedicineEntryState } from '@/lib/schedule/types';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';

const MEDICINE_THEME = LOG_SHEET_THEMES.medicine;

interface LogMedicineSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
  initialEntry?: MedicineEntryState | null;
}

export function LogMedicineSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
  initialEntry,
}: LogMedicineSheetProps) {
  const [entry, setEntry] = useState<MedicineEntryState>(() => initialEntry ?? {
    id: 'draft',
    medicineName: '',
    doseAmount: '1',
    doseForm: 'tablet',
    frequency: 'daily',
    daysOfWeek: [],
    medicineTime: defaultMedicineTimeDate(),
    scheduleDate: createDefaultScheduleDate('ongoing'),
    totalPills: '30',
    reminderOn: true,
    reminderMinutes: DEFAULT_REMINDER_MINUTES,
    notes: '',
  });

  const resetForm = useCallback(() => {
    if (initialEntry) {
      setEntry({ ...initialEntry });
    } else {
      setEntry({
        id: 'draft',
        medicineName: '',
        doseAmount: '1',
        doseForm: 'tablet',
        frequency: 'daily',
        daysOfWeek: [],
        medicineTime: defaultMedicineTimeDate(),
        scheduleDate: createDefaultScheduleDate('ongoing'),
        totalPills: '30',
        reminderOn: true,
        reminderMinutes: DEFAULT_REMINDER_MINUTES,
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
    if (!petId || !token) {
      setError('Add a pet before saving a medicine schedule.');
      return;
    }

    const name = entry.medicineName.trim();
    if (!name) {
      setError('Enter a medicine name.');
      return;
    }

    const dose = buildDoseString(entry.doseAmount, entry.doseForm);
    if (!dose) {
      setError('Enter a valid dose amount.');
      return;
    }

    if (entry.frequency === 'weekly' && entry.daysOfWeek.length === 0) {
      setError('Select at least one day for a weekly schedule.');
      return;
    }

    const dateError = validateScheduleDate(entry.scheduleDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    const pills = parseTotalPills(entry.totalPills);
    if (pills === null) {
      setError('Enter a valid total quantity.');
      return;
    }

    const timeHHmm = dateToTimeHHmm(entry.medicineTime);

    setSaving(true);
    setError(null);
    try {
      await saveScheduleEntry(token, petId, 'medicine', entry);
      const isEdit = Boolean(entry.scheduleId);
      log.ok('LogMedicine', isEdit ? 'Medicine schedule updated' : 'Medicine schedule saved', {
        medicineName: name,
        dose,
        time: timeHHmm,
        frequency: entry.frequency,
      });
      showToast(isEdit ? 'Medicine schedule updated successfully!' : 'Medicine logged successfully!');
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
      title={entry.scheduleId ? 'Edit Medicine' : 'Log Medicine'}
      icon={MEDICINE_THEME.icon}
      accentColor={MEDICINE_THEME.color}
      accentBg={MEDICINE_THEME.bg}
      saveLabel={entry.scheduleId ? 'Save Changes' : 'Save Medicine'}
      onSave={handleSave}
      saving={saving}
      error={error}
      compact
    >
      <MedicineEntryCard
        entry={entry}
        index={0}
        accentColor={MEDICINE_THEME.color}
        accentBg={MEDICINE_THEME.bg}
        canRemove={false}
        embeddedInSheet
        onChange={setEntry}
        onRemove={() => {}}
      />
    </FormSheetShell>
  );
}
