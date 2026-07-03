/** Parse birthday from API (YYYY-MM-DD or ISO) using calendar date parts. */
export function parseBirthdayParts(
  birthday?: string | null | Date | number,
): { year: number; month: number; day: number } | null {
  if (!birthday) return null;

  // Coerce non-string values (e.g. Date objects from Mongoose) to ISO string
  const birthdayStr = typeof birthday === 'string' ? birthday : String(birthday instanceof Date ? birthday.toISOString() : birthday);

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthdayStr.trim());
  if (dateOnly) {
    return {
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]) - 1,
      day: Number(dateOnly[3]),
    };
  }

  const parsed = new Date(birthday);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth(),
    day: parsed.getDate(),
  };
}

export function isBirthdayToday(birthday?: string | null): boolean {
  const parts = parseBirthdayParts(birthday);
  if (!parts) return false;
  const now = new Date();
  return now.getMonth() === parts.month && now.getDate() === parts.day;
}

/** Age the pet turns on their birthday today (0 for first birthday). */
export function getBirthdayTurningAge(birthday?: string | null): number | null {
  const parts = parseBirthdayParts(birthday);
  if (!parts) return null;
  const now = new Date();
  let age = now.getFullYear() - parts.year;
  if (now.getMonth() < parts.month || (now.getMonth() === parts.month && now.getDate() < parts.day)) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function formatBirthdayLabel(birthday?: string | null): string {
  const parts = parseBirthdayParts(birthday);
  if (!parts) return '—';
  const date = new Date(parts.year, parts.month, parts.day);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
