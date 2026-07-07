import { formatInTimeZone as dateFnsFormatInTimeZone } from 'date-fns-tz';

export function parseSafeDate(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);
  
  if (typeof date === 'string') {
    const trimmed = date.trim();
    // 1. Try standard native parse first (works for true ISO strings)
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
    
    // 2. Hermes fallback for YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const fallback = new Date(trimmed.replace(/-/g, '/'));
      if (!isNaN(fallback.getTime())) return fallback;
    }
    
    // 3. Hermes fallback for YYYY-MM-DDTHH:mm:ss without Z
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/.exec(trimmed);
    if (isoMatch) {
      const fallback = new Date(`${isoMatch[1]}/${isoMatch[2]}/${isoMatch[3]} ${isoMatch[4]}:${isoMatch[5]}:${isoMatch[6]}`);
      if (!isNaN(fallback.getTime())) return fallback;
    }
  }
  return new Date(date);
}

export function formatInTimeZone(
  date: Date | string | number,
  timeZone: string | undefined | null,
  formatStr: string
): string {
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
    const d = parseSafeDate(date);
    if (isNaN(d.getTime())) {
      return '';
    }
    return dateFnsFormatInTimeZone(d, tz, formatStr);
  } catch (error) {
    console.error('Error formatting date in timezone:', error, { date, timeZone, formatStr });
    return String(date);
  }
}
