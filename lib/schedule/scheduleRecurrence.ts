import { formatInTimeZone } from 'date-fns-tz';

export type ScheduleRecurrenceMode = 'single' | 'range' | 'ongoing';

/**
 * Parses any date-like input (ISO string, YYYY-MM-DD, Date object, timestamp)
 * into a local Date object set to midnight (00:00:00.000).
 */
export function parseDateToMidnight(
  val: string | Date | number | undefined | null,
  timezone?: string,
): Date | null {
  if (!val) return null;

  if (val instanceof Date) {
    const d = new Date(val.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (typeof val === 'number') {
    const d = new Date(val);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const str = String(val).trim();
  if (!str) return null;

  // Handle YYYY-MM-DD format explicitly to avoid UTC timezone off-by-one shifts
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    if (timezone) {
      try {
        const formatted = formatInTimeZone(parsed, timezone, 'yyyy-MM-dd');
        const [y, m, d] = formatted.split('-').map(Number);
        return new Date(y, m - 1, d, 0, 0, 0, 0);
      } catch {
        // Fallback to local
      }
    }
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  return null;
}

/**
 * Check if two dates represent the exact same calendar day.
 */
export function isSameCalendarDay(
  date1: string | Date | number | undefined | null,
  date2: string | Date | number | undefined | null,
  timezone?: string,
): boolean {
  const d1 = parseDateToMidnight(date1, timezone);
  const d2 = parseDateToMidnight(date2, timezone);
  if (!d1 || !d2) return false;
  return d1.getTime() === d2.getTime();
}

/**
 * Normalizes day-of-week strings or numbers (e.g. 'MO', 'mon', 'Monday', 1) to standard 0-6 index (0 = Sunday).
 */
export function normalizeDayOfWeek(val: string | number): number | null {
  if (typeof val === 'number') {
    return val >= 0 && val <= 6 ? val : null;
  }
  const s = String(val).trim().toLowerCase();
  if (s === 'su' || s === 'sun' || s === 'sunday' || s === '0') return 0;
  if (s === 'mo' || s === 'mon' || s === 'monday' || s === '1') return 1;
  if (s === 'tu' || s === 'tue' || s === 'tuesday' || s === '2') return 2;
  if (s === 'we' || s === 'wed' || s === 'wednesday' || s === '3') return 3;
  if (s === 'th' || s === 'thu' || s === 'thursday' || s === '4') return 4;
  if (s === 'fr' || s === 'fri' || s === 'friday' || s === '5') return 5;
  if (s === 'sa' || s === 'sat' || s === 'saturday' || s === '6') return 6;
  return null;
}

/**
 * Resolves whether a schedule is single day, date range, or ongoing/recurring.
 */
export function resolveScheduleMode(s: any): ScheduleRecurrenceMode {
  const explicitMode = s.scheduleDate?.mode || s.metadata?.scheduleDate?.mode || s.scheduleType;
  if (explicitMode === 'single' || explicitMode === 'range' || explicitMode === 'ongoing') {
    return explicitMode;
  }
  if (explicitMode === 'recurring') {
    return 'ongoing';
  }

  const daysOfWeek = s.daysOfWeek || s.metadata?.daysOfWeek || s.scheduleDate?.daysOfWeek;
  const hasDaysOfWeek = Array.isArray(daysOfWeek) && daysOfWeek.length > 0;

  const hasExplicitSingle = Boolean(
    s.scheduleDate?.singleDate ||
    s.singleDate ||
    s.date ||
    s.dateTime ||
    s.scheduledDate ||
    s.dueDate ||
    s.metadata?.date ||
    s.metadata?.dueDate ||
    s.metadata?.scheduledDate,
  );

  const startStr = s.startDate || s.scheduleDate?.startDate || s.metadata?.startDate;
  const endStr = s.endDate || s.scheduleDate?.endDate || s.metadata?.endDate;
  const hasStart = Boolean(startStr);
  const hasEnd = Boolean(endStr);

  if (hasExplicitSingle && !hasEnd && !hasDaysOfWeek) {
    if (!hasStart || isSameCalendarDay(startStr, s.date || s.scheduleDate || s.singleDate)) {
      return 'single';
    }
  }

  const frequency = (s.frequency || s.metadata?.frequency || '').toLowerCase();
  if (frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly' || frequency === 'custom' || hasDaysOfWeek) {
    return hasEnd ? 'range' : 'ongoing';
  }

  if (hasStart && hasEnd) {
    return 'range';
  }

  if (hasStart && !hasEnd) {
    return 'ongoing';
  }

  if (hasExplicitSingle) {
    return 'single';
  }

  // Default to ongoing for repeatable tasks
  return 'ongoing';
}

/**
 * Determines whether a schedule item is active on a given target date (defaults to today).
 */
export function isScheduleActiveOnDate(
  s: any,
  targetDate: Date = new Date(),
  timezone?: string,
): boolean {
  if (!s) return false;

  const target = parseDateToMidnight(targetDate, timezone) || new Date();
  target.setHours(0, 0, 0, 0);

  const mode = resolveScheduleMode(s);

  // 1. Single Day Check
  if (mode === 'single') {
    const singleStr =
      s.scheduleDate?.singleDate ||
      s.singleDate ||
      s.date ||
      s.dateTime ||
      s.scheduledDate ||
      s.dueDate ||
      s.startDate ||
      s.metadata?.date ||
      s.metadata?.dueDate ||
      s.metadata?.scheduledDate;

    if (!singleStr) return true; // If no date specified at all, allow today
    const singleDate = parseDateToMidnight(singleStr, timezone);
    if (!singleDate) return true;
    return target.getTime() === singleDate.getTime();
  }

  // 2. Date Range / Ongoing Check
  const startStr =
    s.startDate ||
    s.scheduleDate?.startDate ||
    s.metadata?.startDate ||
    s.date ||
    s.metadata?.date;
  const endStr =
    s.endDate ||
    s.scheduleDate?.endDate ||
    s.metadata?.endDate;

  if (startStr) {
    const startDate = parseDateToMidnight(startStr, timezone);
    if (startDate && target.getTime() < startDate.getTime()) {
      return false;
    }
  }

  if (endStr) {
    const endDate = parseDateToMidnight(endStr, timezone);
    if (endDate && target.getTime() > endDate.getTime()) {
      return false;
    }
  }

  // 3. Days of Week Check (for weekly recurrence)
  const daysOfWeek = s.daysOfWeek || s.metadata?.daysOfWeek || s.scheduleDate?.daysOfWeek;
  if (Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
    const currentDayOfWeek = target.getDay(); // 0 = Sunday, 1 = Monday, ...
    const allowedDays = daysOfWeek
      .map(normalizeDayOfWeek)
      .filter((d): d is number => d !== null);

    if (allowedDays.length > 0 && !allowedDays.includes(currentDayOfWeek)) {
      return false;
    }
  }

  // 4. Monthly Frequency Check
  const frequency = (s.frequency || s.metadata?.frequency || '').toLowerCase();
  if (frequency === 'monthly' && startStr) {
    const startDate = parseDateToMidnight(startStr, timezone);
    if (startDate && target.getDate() !== startDate.getDate()) {
      return false;
    }
  }

  return true;
}

/**
 * Determines whether a schedule item is completed for the given date (defaults to today).
 * For recurring tasks, completions from prior days automatically reset to pending for today.
 */
export function isScheduleDoneForDate(
  s: any,
  targetDate: Date = new Date(),
  kind?: string,
  timezone?: string,
): boolean {
  if (!s) return false;

  if (kind === 'grooming') {
    if (!s.performedAt) return false;
    return isSameCalendarDay(s.performedAt, targetDate, timezone);
  }

  if (kind === 'vaccination') {
    if (s.isActive === false) return true;
    const adminDate = s.metadata?.administeredDate || s.administeredDate;
    if (adminDate) {
      return isSameCalendarDay(adminDate, targetDate, timezone);
    }
    return false;
  }

  const mode = resolveScheduleMode(s);
  const isRecurring = mode === 'ongoing' || mode === 'range';

  const completedAt = s.completedAt || s.performedAt || s.metadata?.completedAt;

  if (completedAt) {
    const isToday = isSameCalendarDay(completedAt, targetDate, timezone);
    if (isRecurring) {
      return isToday;
    }
    return true;
  }

  const status = s.status;
  const isComplete = s.isComplete === true;

  if (status === 'done' || isComplete) {
    // If it's a recurring task with an updated/timestamp field from a past date, reset for today
    const updateTime = s.updatedAt || s.createdAt;
    if (isRecurring && updateTime) {
      const isUpdatedToday = isSameCalendarDay(updateTime, targetDate, timezone);
      if (!isUpdatedToday) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Determines whether a schedule item was skipped for the given date (defaults to today).
 * For recurring tasks, skips from prior days automatically reset to pending for today.
 */
export function isScheduleSkippedForDate(
  s: any,
  targetDate: Date = new Date(),
  kind?: string,
  timezone?: string,
): boolean {
  if (!s || kind === 'grooming' || kind === 'vaccination') return false;

  const mode = resolveScheduleMode(s);
  const isRecurring = mode === 'ongoing' || mode === 'range';

  if (s.status === 'skipped') {
    const skipTimestamp = s.skippedAt || s.completedAt || s.updatedAt;
    if (isRecurring && skipTimestamp) {
      return isSameCalendarDay(skipTimestamp, targetDate, timezone);
    }
    return true;
  }

  return false;
}
