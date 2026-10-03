import { formatCompletedAt, formatTimeHHmmDisplay } from '@/lib/feeding/feedingForm';
import { getFrequencyLabel } from '@/lib/medicine/medicineForm';
import type { MedicineScheduleItem } from '@/types/medicine';

const MEDICINE_COLORS = {
  color: '#5B9BD5',
  bg: '#E3F2FD',
};

export function medicineScheduleTitle(item: MedicineScheduleItem): string {
  const name = item.metadata?.medicineName;
  if (name) return name;
  const title = item.title || 'Medicine';
  const dash = title.indexOf(' - ');
  return dash > 0 ? title.slice(0, dash) : title;
}

export function medicineScheduleSubtitle(item: MedicineScheduleItem): string {
  const dose = item.metadata?.dose;
  const doseText = dose ? `${dose} · ` : '';
  const timeStr = item.timeOfDay || (item as any).time || item.metadata?.time || '00:00';

  if (item.status === 'done') {
    const when = item.completedAt
      ? formatCompletedAt(item.completedAt)
      : formatTimeHHmmDisplay(timeStr);
    return `${doseText}Done at ${when}`;
  }

  if (item.status === 'skipped') {
    return `${doseText}Skipped today`;
  }

  const freq = item.metadata?.frequency;
  const freqText = freq && freq !== 'daily' ? `${getFrequencyLabel(freq)} · ` : '';
  return `${doseText}${freqText}${formatTimeHHmmDisplay(timeStr)}`;
}

export function medicineScheduleColors() {
  return MEDICINE_COLORS;
}

export function sortMedicineByTime(items: MedicineScheduleItem[]): MedicineScheduleItem[] {
  return [...items].sort((a, b) => {
    const timeA = a.timeOfDay || (a as any).time || a.metadata?.time || '00:00';
    const timeB = b.timeOfDay || (b as any).time || b.metadata?.time || '00:00';
    return String(timeA).localeCompare(String(timeB));
  });
}

export function pendingMedicineSchedules(items: MedicineScheduleItem[]): MedicineScheduleItem[] {
  return sortMedicineByTime(
    items.filter((item) => item.status !== 'done' && item.status !== 'skipped'),
  );
}
