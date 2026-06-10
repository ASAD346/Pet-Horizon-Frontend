import { DEFAULT_REMINDER_MINUTES } from '@/lib/feeding/feedingForm';

export function timeHHmmToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((part) => parseInt(part, 10));
  const d = new Date();
  d.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return d;
}

export function apiDateToLocalDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function reminderMinutesFromMeta(
  timeHHmm: string,
  reminderTime?: string,
  fallback = DEFAULT_REMINDER_MINUTES,
): number {
  if (!reminderTime) return fallback;
  const [th, tm] = timeHHmm.split(':').map((p) => parseInt(p, 10));
  const [rh, rm] = reminderTime.split(':').map((p) => parseInt(p, 10));
  if ([th, tm, rh, rm].some((n) => Number.isNaN(n))) return fallback;
  const scheduled = th * 60 + tm;
  const reminder = rh * 60 + rm;
  const diff = scheduled - reminder;
  return diff > 0 ? diff : fallback;
}
