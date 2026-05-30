/** Standard meal types shown in Log Food (API values + UI labels). */
export const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snack' },
] as const;

export type MealTypeOption = (typeof MEAL_TYPE_OPTIONS)[number];

/** Filter standard meals to those allowed for the pet species. */
export function mealTypeOptionsForSpecies(allowedApiTypes: string[]) {
  const allowed = new Set(allowedApiTypes.map((t) => t.toLowerCase()));
  const standard = MEAL_TYPE_OPTIONS.filter((o) => allowed.has(o.value));
  if (standard.length > 0) return standard;

  return allowedApiTypes.map((value) => ({
    value,
    label: formatMealTypeLabel(value),
  }));
}

export function getMealTypeLabel(value: string): string {
  const found = MEAL_TYPE_OPTIONS.find((o) => o.value === value.toLowerCase());
  return found?.label ?? formatMealTypeLabel(value);
}

/** Display label for non-standard API meal types. */
export function formatMealTypeLabel(mealType: string): string {
  return mealType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Unit options for dropdown (dedupe by display label). */
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

export function getUnitLabel(value: string, units: string[]): string {
  const match = units.find((u) => u === value);
  return formatUnitLabel(match ?? value);
}

export function defaultFeedingTimeDate(): Date {
  const d = new Date();
  d.setHours(8, 30, 0, 0);
  return d;
}
