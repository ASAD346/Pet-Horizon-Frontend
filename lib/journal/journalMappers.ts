import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ApiJournalEntry } from '@/types/journal';
import type { JournalCategory, TimelineEvent } from '@/components/journal/journalData';
import type { JournalDateItem } from '@/components/journal/JournalDateStrip';
import { parseSafeDate } from '@/lib/timezone';

type MciIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatTimeLabel(iso: string): string {
  return parseSafeDate(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function buildDateStrip(weekStart: Date, days = 7): JournalDateItem[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      id: toDateKey(date),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
    };
  });
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function shiftWeekStart(weekStart: Date, deltaWeeks: number): Date {
  const next = new Date(weekStart);
  next.setDate(next.getDate() + deltaWeeks * 7);
  return next;
}

export function mapActivityTypeToCategory(activityType: string): Exclude<JournalCategory, 'all'> {
  const value = activityType.toLowerCase();
  if (value === 'feeding' || value === 'food') return 'food';
  if (value === 'walk' || value === 'walks') return 'walk';
  if (value === 'medicine') return 'medicine';
  if (value === 'grooming') return 'grooming';
  if (value === 'vaccination') return 'vaccination';
  return 'general';
}

export function categoryToMaterialIcon(category: Exclude<JournalCategory, 'all'>): MciIcon {
  switch (category) {
    case 'food':
      return 'silverware-fork-knife';
    case 'walk':
      return 'walk';
    case 'medicine':
      return 'pill';
    case 'grooming':
      return 'content-cut';
    case 'vaccination':
      return 'needle';
    default:
      return 'notebook-outline';
  }
}

export function formatEntryTitle(entry: ApiJournalEntry): string {
  let note = entry.note?.trim() || '';
  if (note.toLowerCase().startsWith('skipped')) {
    note = note.slice(7).trim();
    if (note.startsWith(':')) note = note.slice(1).trim();
  } else if (note.toLowerCase().startsWith('missed')) {
    note = note.slice(6).trim();
    if (note.startsWith(':')) note = note.slice(1).trim();
  } else if (note.toLowerCase().startsWith('not performed')) {
    note = note.slice(13).trim();
    if (note.startsWith(':')) note = note.slice(1).trim();
  }
  
  // Deduplicate redundant suffix combinations
  note = note.replace(/Feed Feeding/gi, 'Feeding');
  note = note.replace(/Walk Walking/gi, 'Walking');
  note = note.replace(/Walk Walk/gi, 'Walk');
  note = note.replace(/feed feeding/gi, 'feeding');
  note = note.replace(/walk walking/gi, 'walking');
  note = note.replace(/walk walk/gi, 'walk');

  if (note) {
    note = note.charAt(0).toUpperCase() + note.slice(1);
    return note;
  }
  const type = entry.activityType?.trim() || 'Activity';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function mapEntryToTimelineEvent(entry: ApiJournalEntry): TimelineEvent {
  const category = mapActivityTypeToCategory(entry.activityType);
  let status: TimelineEvent['status'] = 'completed';
  if (entry.status === 'skipped') {
    status = 'skipped';
  } else if (entry.status === 'missed') {
    status = 'missed';
  } else {
    // Fallback to legacy string checking just in case
    const lowerNote = (entry.note || '').toLowerCase();
    if (lowerNote.startsWith('skipped')) {
      status = 'skipped';
    } else if (lowerNote.startsWith('missed') || lowerNote.startsWith('not performed')) {
      status = 'missed';
    }
  }

  return {
    id: entry._id,
    time: formatTimeLabel(entry.createdAt),
    title: formatEntryTitle(entry),
    status,
    category,
    materialIcon: categoryToMaterialIcon(category),
    imageUrl: entry.imagePath ?? null,
  };
}

export function filterEntriesByDate(
  entries: ApiJournalEntry[],
  dateStr: string,
): ApiJournalEntry[] {
  const target = parseDateKey(dateStr);
  return entries.filter((entry) => isSameCalendarDay(parseSafeDate(entry.createdAt), target));
}

export function filterTimelineByCategory(
  events: TimelineEvent[],
  category: JournalCategory,
): TimelineEvent[] {
  if (category === 'all') return events;
  return events.filter((event) => event.category === category);
}

export function extractPhotoUrls(entries: ApiJournalEntry[]): string[] {
  return entries
    .map((entry) => entry.imagePath)
    .filter((path): path is string => Boolean(path));
}

export function findPhotoUploadTarget(entries: ApiJournalEntry[]): ApiJournalEntry | null {
  return entries.find((entry) => entry.canUploadImage) ?? null;
}
