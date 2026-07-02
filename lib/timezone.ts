import { formatInTimeZone as dateFnsFormatInTimeZone } from 'date-fns-tz';

export function formatInTimeZone(
  date: Date | string | number,
  timeZone: string | undefined | null,
  formatStr: string
): string {
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (d instanceof Date && isNaN(d.getTime())) {
      return '';
    }
    return dateFnsFormatInTimeZone(d, tz, formatStr);
  } catch (error) {
    console.error('Error formatting date in timezone:', error, { date, timeZone, formatStr });
    return String(date);
  }
}
