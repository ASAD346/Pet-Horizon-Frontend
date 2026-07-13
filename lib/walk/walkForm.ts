import {
  dateToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  formatTimeDisplay,
  REMINDER_MINUTES_OPTIONS,
} from '@/lib/feeding/feedingForm';

export { dateToTimeHHmm, DEFAULT_REMINDER_MINUTES, formatTimeDisplay, REMINDER_MINUTES_OPTIONS };

export const WALK_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
] as const;

import { getTaskDisplayName } from '@/src/utils/taskMappings';

export function getWalkTimeLabel(value: string): string {
  return getTaskDisplayName(value);
}

export function defaultWalkTimeDate(): Date {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return d;
}

export function parseDurationMinutes(value: string): number | null {
  const n = parseInt(value.trim(), 10);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}
