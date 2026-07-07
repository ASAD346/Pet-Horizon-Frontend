import { formatDateLabel } from '@/lib/grooming/groomingForm';
import { parseSafeDate } from '@/lib/timezone';
import type { GroomingRecord } from '@/types/grooming';

const GROOMING_COLORS = {
  color: '#E91E8C',
  bg: '#FCE4F0',
};

export function groomingRecordTitle(item: GroomingRecord): string {
  return item.groomingType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function groomingRecordSubtitle(item: GroomingRecord): string {
  if (item.performedAt) {
    const when = formatDateLabel(parseSafeDate(item.performedAt));
    return `Completed ${when}`;
  }

  const parts: string[] = [];

  if (item.scheduledDate) {
    const due = formatDateLabel(parseSafeDate(item.scheduledDate));
    if (item.remainingDays === 0) parts.push(`Due today (${due})`);
    else if (item.remainingDays !== null && item.remainingDays !== undefined && item.remainingDays < 0) {
      parts.push(`Overdue · was ${due}`);
    } else if (item.remainingDays !== null && item.remainingDays !== undefined) {
      parts.push(`Due ${due} · in ${item.remainingDays} day${item.remainingDays === 1 ? '' : 's'}`);
    } else {
      parts.push(`Due ${due}`);
    }
  } else {
    parts.push('No due date set');
  }

  if (item.nextDueDate) {
    parts.push(`Next: ${formatDateLabel(parseSafeDate(item.nextDueDate))}`);
  }

  if (item.reminderEnabled === false) {
    parts.push('Reminder off');
  }

  if (item.notes?.trim()) {
    parts.push(item.notes.trim());
  }

  return parts.join(' · ');
}

export function groomingRecordColors() {
  return GROOMING_COLORS;
}

export function groomingSortKey(item: GroomingRecord): number {
  if (item.scheduledDate) {
    return parseSafeDate(item.scheduledDate).getTime();
  }
  return Number.MAX_SAFE_INTEGER;
}

export function sortGroomingByDate(items: GroomingRecord[]): GroomingRecord[] {
  return [...items].sort((a, b) => groomingSortKey(a) - groomingSortKey(b));
}

export function pendingGroomingRecords(items: GroomingRecord[]): GroomingRecord[] {
  return sortGroomingByDate(items.filter((item) => !item.performedAt));
}

export function groomingDueTodayOrOverdue(items: GroomingRecord[]): GroomingRecord[] {
  return sortGroomingByDate(
    items.filter((item) => {
      if (item.performedAt) return false;
      if (item.remainingDays !== null && item.remainingDays !== undefined) {
        return item.remainingDays <= 0;
      }
      if (item.scheduledDate) {
        const due = parseSafeDate(item.scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due.getTime() <= today.getTime();
      }
      return false;
    }),
  );
}
