import { formatDateLabel, reminderFrequencyLabel } from '@/lib/vaccination/vaccinationForm';
import type { VaccinationScheduleItem } from '@/types/vaccination';

const VACCINATION_COLORS = {
  color: '#673AB7',
  bg: '#EDE7F6',
};

export function vaccinationScheduleTitle(item: VaccinationScheduleItem): string {
  return item.metadata?.vaccineName || item.title || 'Vaccination';
}

export function vaccinationDueDate(item: VaccinationScheduleItem): Date | null {
  const raw = item.metadata?.dueDate || item.startDate;
  if (!raw) return null;
  return new Date(raw);
}

export function vaccinationScheduleSubtitle(item: VaccinationScheduleItem): string {
  const parts: string[] = [];
  const due = vaccinationDueDate(item);

  if (due) {
    const dueLabel = formatDateLabel(due);
    if (item.remainingDays === 0) {
      parts.push(`Due today (${dueLabel})`);
    } else if (item.remainingDays !== null && item.remainingDays !== undefined && item.remainingDays < 0) {
      parts.push(`Overdue · was ${dueLabel}`);
    } else if (item.remainingDays !== null && item.remainingDays !== undefined) {
      parts.push(
        `Due ${dueLabel} · in ${item.remainingDays} day${item.remainingDays === 1 ? '' : 's'}`,
      );
    } else {
      parts.push(`Due ${dueLabel}`);
    }
  } else {
    parts.push('No due date set');
  }

  if (item.metadata?.isRecurring && item.metadata.recurrenceInterval) {
    parts.push(`Repeats ${item.metadata.recurrenceInterval}`);
  }

  if (item.metadata?.frequency) {
    parts.push(`Reminder ${reminderFrequencyLabel(String(item.metadata.frequency))}`);
  } else if (item.metadata?.reminder === false) {
    parts.push('Reminder off');
  }

  if (item.notes?.trim()) {
    parts.push(item.notes.trim());
  } else if (item.description?.trim()) {
    parts.push(item.description.trim());
  }

  return parts.join(' · ');
}

export function vaccinationScheduleColors() {
  return VACCINATION_COLORS;
}

export function vaccinationSortKey(item: VaccinationScheduleItem): number {
  const due = vaccinationDueDate(item);
  if (due) return due.getTime();
  return Number.MAX_SAFE_INTEGER;
}

export function sortVaccinationByDate(items: VaccinationScheduleItem[]): VaccinationScheduleItem[] {
  return [...items].sort((a, b) => vaccinationSortKey(a) - vaccinationSortKey(b));
}

export function pendingVaccinationSchedules(
  items: VaccinationScheduleItem[],
): VaccinationScheduleItem[] {
  return sortVaccinationByDate(items.filter((item) => item.isActive !== false));
}

export function vaccinationDueTodayOrOverdue(
  items: VaccinationScheduleItem[],
): VaccinationScheduleItem[] {
  return sortVaccinationByDate(
    items.filter((item) => {
      if (item.isActive === false) return false;
      if (item.remainingDays !== null && item.remainingDays !== undefined) {
        return item.remainingDays <= 0;
      }
      const due = vaccinationDueDate(item);
      if (!due) return false;
      const today = new Date();
      due.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return due.getTime() <= today.getTime();
    }),
  );
}
