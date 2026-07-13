/** Standard meal types shown in Log Food (API values + UI labels). */
export const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
] as const;

export type MealTypeOption = (typeof MEAL_TYPE_OPTIONS)[number];

/** Reminder offset options (minutes after feeding time). */
export const REMINDER_MINUTES_OPTIONS = [
  { value: 5, label: '5 min after' },
  { value: 10, label: '10 min after' },
  { value: 15, label: '15 min after' },
  { value: 30, label: '30 min after' },
  { value: 60, label: '1 hour after' },
] as const;

export const DEFAULT_REMINDER_MINUTES = 10;

export function getReminderMinutesLabel(minutes: number): string {
  const found = REMINDER_MINUTES_OPTIONS.find((o) => o.value === minutes);
  return found?.label ?? `${minutes} min after`;
}

/** Add minutes to HH:mm and return HH:mm (24h). */
export function addMinutesToTimeHHmm(hhmm: string, minutes: number): string {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return hhmm;
  const total = parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60)
    .toString()
    .padStart(2, '0');
  const m = (normalized % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

import { getTaskDisplayName } from '@/src/utils/taskMappings';

export function getMealTypeLabel(value: string): string {
  return getTaskDisplayName(value);
}

/** Display label for non-standard API meal types. */
export function formatMealTypeLabel(mealType: string): string {
  return mealType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Build meal type chips from species-allowed API values. */
export function mealTypeOptionsForSpecies(allowedApiTypes: string[]) {
  return allowedApiTypes.map((value) => ({
    value,
    label: getMealTypeLabel(value),
  }));
}

/** Build unit chips from species-allowed API values. */
export function unitOptionsForSpecies(allowedUnits: string[]) {
  return unitOptionsForPicker(allowedUnits);
}

/** Unit options for picker (dedupe by display label). */
export function unitOptionsForPicker(units: string[]) {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const unit of units) {
    const label = formatUnitLabel(unit);
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ value: unit, label });
  }
  return options;
}

/** Convert Date to backend HH:mm (24-hour). */
export function dateToTimeHHmm(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** 12-hour label for UI (e.g. 08:30 AM). */
export function formatTimeDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Pick a sensible default unit from species-allowed list. */
export function pickDefaultUnit(units: string[]): string {
  if (!units.length) return 'cup';
  const lower = units.map((u) => u.toLowerCase());
  if (lower.includes('cup')) return units[lower.indexOf('cup')];
  if (lower.includes('cups')) return units[lower.indexOf('cups')];
  if (lower.includes('g')) return units[lower.indexOf('g')];
  return units[0];
}

/** Short label for unit dropdown. */
export function formatUnitLabel(unit: string): string {
  const u = unit.toLowerCase();
  if (u === 'gram' || u === 'grams') return 'g';
  if (u === 'cups') return 'cup';
  if (u === 'tablespoon' || u === 'tablespoons') return 'tbsp';
  return unit;
}

export function getUnitLabel(value: string): string {
  return formatUnitLabel(value);
}

export function defaultFeedingTimeDate(): Date {
  const d = new Date();
  d.setHours(8, 30, 0, 0);
  return d;
}

/** Convert backend HH:mm to Date (today's date). */
export function timeHHmmToDate(hhmm: string): Date {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  const d = new Date();
  if (!match) return d;
  d.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
  return d;
}

/** Parse API YYYY-MM-DD to local Date. */
export function apiDateStringToDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/** Convert backend HH:mm to 12-hour display label. */
export function formatTimeHHmmDisplay(hhmm: string): string {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return hhmm;
  const d = new Date();
  d.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
  return formatTimeDisplay(d);
}

export function formatCompletedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const MEAL_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  breakfast: { color: '#5CB35D', bg: '#E8F5E9' },
  lunch: { color: '#F5A623', bg: '#FFF8E1' },
  dinner: { color: '#E57373', bg: '#FFEBEE' },
  snacks: { color: '#FF9800', bg: '#FFF3E0' },
  morning_feed: { color: '#5CB35D', bg: '#E8F5E9' },
  evening_feed: { color: '#E57373', bg: '#FFEBEE' },
  automatic_feeder: { color: '#5B9BD5', bg: '#E3F2FD' },
};

export function feedingMealColors(mealType?: string) {
  const key = (mealType ?? '').toLowerCase();
  return MEAL_TYPE_COLORS[key] ?? { color: '#F5A623', bg: '#FFF8E1' };
}
