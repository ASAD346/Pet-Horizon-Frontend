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
  const pills = item.metadata?.remainingPills;
  const stockText =
    pills !== undefined && pills !== null ? `${pills} left · ` : '';

  if (item.status === 'done') {
    const when = item.completedAt
      ? formatCompletedAt(item.completedAt)
      : formatTimeHHmmDisplay(item.timeOfDay);
    return `${doseText}${stockText}Done at ${when}`;
  }

  if (item.status === 'skipped') {
    return `${doseText}Skipped today`;
  }

  const freq = item.metadata?.frequency;
  const freqText = freq && freq !== 'daily' ? `${getFrequencyLabel(freq)} · ` : '';
  return `${doseText}${stockText}${freqText}${formatTimeHHmmDisplay(item.timeOfDay)}`;
}

export function medicineScheduleColors() {
  return MEDICINE_COLORS;
}

export function sortMedicineByTime(items: MedicineScheduleItem[]): MedicineScheduleItem[] {
  return [...items].sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
}

export function pendingMedicineSchedules(items: MedicineScheduleItem[]): MedicineScheduleItem[] {
  return sortMedicineByTime(
    items.filter((item) => item.status !== 'done' && item.status !== 'skipped'),
  );
}
