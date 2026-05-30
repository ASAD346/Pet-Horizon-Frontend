import {
  dateToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  formatTimeDisplay,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';
import type { DayOfWeekCode, MedicineDoseForm, MedicineFrequency } from '@/types/medicine';

export { dateToTimeHHmm, DEFAULT_REMINDER_MINUTES, formatTimeDisplay, REMINDER_MINUTES_OPTIONS };

export const DOSE_FORM_OPTIONS: { value: MedicineDoseForm; label: string }[] = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'syrup', label: 'Syrup' },
];

export const FREQUENCY_OPTIONS: { value: MedicineFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const DAYS_OF_WEEK_OPTIONS: { value: DayOfWeekCode; label: string }[] = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
];

export function defaultMedicineTimeDate(): Date {
  const d = new Date();
  d.setHours(10, 30, 0, 0);
  return d;
}

export function startOfDayDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** API date string (YYYY-MM-DD). */
export function dateToApiDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isStartBeforeOrEqualEnd(start: Date, end: Date): boolean {
  return startOfDayDate(start).getTime() <= startOfDayDate(end).getTime();
}

export function buildDoseString(amount: string, doseForm: MedicineDoseForm): string | null {
  const trimmed = amount.trim();
  const n = parseFloat(trimmed);
  if (Number.isNaN(n) || n <= 0) return null;

  if (doseForm === 'tablet') {
    return n === 1 ? '1 tablet' : `${trimmed} tablets`;
  }

  return `${trimmed} ml`;
}

export function parseTotalPills(value: string): number | null {
  const n = parseInt(value.trim(), 10);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function getFrequencyLabel(value: string): string {
  const found = FREQUENCY_OPTIONS.find((o) => o.value === value.toLowerCase());
  return found?.label ?? value.charAt(0).toUpperCase() + value.slice(1);
}

export function getDoseFormLabel(value: MedicineDoseForm): string {
  const found = DOSE_FORM_OPTIONS.find((o) => o.value === value);
  return found?.label ?? value;
}
