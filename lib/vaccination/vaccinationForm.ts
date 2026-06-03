import { dateToTimeHHmm } from '@/lib/feeding/feedingForm';
import type {
  VaccinationRecurrenceInterval,
  VaccinationReminderFrequency,
} from '@/types/vaccination';

export const VACCINATION_REMINDER_FREQUENCY_OPTIONS: {
  value: VaccinationReminderFrequency;
  label: string;
}[] = [
  { value: '1_day', label: '1 day before' },
  { value: '3_days', label: '3 days before' },
  { value: '7_days', label: '7 days before' },
  { value: '14_days', label: '14 days before' },
  { value: '30_days', label: '30 days before' },
  { value: 'on_due', label: 'On due date' },
];

export const VACCINATION_RECURRENCE_OPTIONS: {
  value: VaccinationRecurrenceInterval;
  label: string;
}[] = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
];

/** API date string (YYYY-MM-DD). */
export function dateToApiDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function defaultDueDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 30);
  return d;
}

export function defaultReminderTimeDate(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

export function reminderFrequencyLabel(value: string): string {
  return (
    VACCINATION_REMINDER_FREQUENCY_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/_/g, ' ')
  );
}

export function recurrenceIntervalLabel(value: string): string {
  return (
    VACCINATION_RECURRENCE_OPTIONS.find((option) => option.value === value)?.label ??
    value.charAt(0).toUpperCase() + value.slice(1)
  );
}

export function computeNextDueDate(
  from: Date,
  interval: VaccinationRecurrenceInterval,
): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  if (interval === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else if (interval === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (interval === 'weekly') {
    d.setDate(d.getDate() + 7);
  }
  return d;
}

export { dateToTimeHHmm };
