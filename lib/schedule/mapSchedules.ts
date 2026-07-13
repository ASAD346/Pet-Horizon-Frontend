import {
  apiDateStringToDate,
  dateToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  formatTimeDisplay,
  formatTimeHHmmDisplay,
  formatUnitLabel,
  getMealTypeLabel,
  timeHHmmToDate,
} from '@/lib/feeding/feedingForm';
import { groomingTypeLabel } from '@/lib/grooming/groomingForm';
import { parseSafeDate } from '@/lib/timezone';
import {
  getFrequencyLabel,
  parseDoseString,
} from '@/lib/medicine/medicineForm';
import {
  reminderFrequencyLabel,
} from '@/lib/vaccination/vaccinationForm';
import { getWalkTimeLabel } from '@/lib/walk/walkForm';
import { parseScheduleDateFromApi, formatScheduleDateSummary } from '@/lib/schedule/scheduleDate';
import { newEntryId } from '@/lib/schedule/defaults';
import type {
  FeedingEntryState,
  GroomingEntryState,
  MedicineEntryState,
  ScheduleSectionKey,
  ScheduleSectionsState,
  VaccinationEntryState,
  WalkEntryState,
} from '@/lib/schedule/types';
import type { FeedingScheduleItem } from '@/types/feeding';
import type { GroomingRecord } from '@/types/grooming';
import type { MedicineScheduleItem } from '@/types/medicine';
import type {
  VaccinationReminderFrequency,
  VaccinationScheduleItem,
} from '@/types/vaccination';
import type { WalkScheduleItem } from '@/types/walk';

function normalizeVaccinationFrequency(value: unknown): VaccinationReminderFrequency {
  if (typeof value === 'string') {
    const known: VaccinationReminderFrequency[] = [
      '1_day',
      '3_days',
      '7_days',
      '14_days',
      '30_days',
      'on_due',
    ];
    if (known.includes(value as VaccinationReminderFrequency)) {
      return value as VaccinationReminderFrequency;
    }
  }
  if (typeof value === 'number') {
    const map: Record<number, VaccinationReminderFrequency> = {
      1: '1_day',
      3: '3_days',
      7: '7_days',
      14: '14_days',
      30: '30_days',
      0: 'on_due',
    };
    return map[value] ?? '7_days';
  }
  return '7_days';
}

export function mapFeedingItem(item: FeedingScheduleItem): FeedingEntryState {
  const meta = item.metadata ?? {};
  return {
    id: newEntryId(),
    scheduleId: item._id,
    mealType: meta.mealType ?? '',
    amount: meta.amount ?? '',
    unit: meta.unit ?? '',
    feedingTime: timeHHmmToDate(item.timeOfDay),
    scheduleDate: parseScheduleDateFromApi({
      date: (item as FeedingScheduleItem & { date?: string }).date,
      startDate: (item as FeedingScheduleItem & { startDate?: string }).startDate,
      endDate: (item as FeedingScheduleItem & { endDate?: string }).endDate,
    }),
    notificationsOn: meta.reminder === true,
    reminderMinutes: meta.reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? item.notes ?? item.description ?? '',
    status: (item as any).status,
    isComplete: (item as any).isComplete,
  };
}

export function mapWalkItem(item: WalkScheduleItem): WalkEntryState {
  const meta = item.metadata ?? {};
  return {
    id: newEntryId(),
    scheduleId: item._id,
    walkTime: meta.walkTime ?? 'morning',
    duration: meta.duration != null ? String(meta.duration) : '30',
    walkClockTime: timeHHmmToDate(item.timeOfDay),
    scheduleDate: parseScheduleDateFromApi({
      date: (item as WalkScheduleItem & { date?: string }).date,
      startDate: (item as WalkScheduleItem & { startDate?: string }).startDate,
      endDate: (item as WalkScheduleItem & { endDate?: string }).endDate,
    }),
    notificationsOn: meta.reminder === true,
    reminderMinutes: meta.reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? item.notes ?? item.description ?? '',
    status: (item as any).status,
    isComplete: (item as any).isComplete,
  };
}

export function mapMedicineItem(item: MedicineScheduleItem): MedicineEntryState {
  const meta = item.metadata ?? {};
  const parsed = parseDoseString(meta.dose ?? '');
  return {
    id: newEntryId(),
    scheduleId: item._id,
    medicineName: meta.medicineName ?? item.title.split(' - ')[0] ?? '',
    doseAmount: parsed.amount,
    doseForm: meta.doseForm ?? parsed.doseForm,
    frequency: meta.frequency ?? 'daily',
    daysOfWeek: meta.daysOfWeek ?? [],
    medicineTime: timeHHmmToDate(item.timeOfDay),
    scheduleDate: parseScheduleDateFromApi({
      date: (item as MedicineScheduleItem & { date?: string }).date,
      startDate: item.startDate,
      endDate: item.endDate,
    }),
    totalPills:
      meta.totalPills != null
        ? String(meta.totalPills)
        : meta.remainingPills != null
          ? String(meta.remainingPills)
          : '30',
    reminderOn: meta.reminder === true,
    reminderMinutes: meta.reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? item.notes ?? item.description ?? '',
    status: (item as any).status,
    isComplete: (item as any).isComplete,
  };
}

export function mapVaccinationItem(item: VaccinationScheduleItem): VaccinationEntryState {
  const meta = item.metadata ?? {};
  const dueRaw = meta.dueDate ?? item.startDate;
  return {
    id: newEntryId(),
    scheduleId: item._id,
    vaccineName: meta.vaccineName ?? item.title ?? '',
    scheduleDate: parseScheduleDateFromApi({
      date: dueRaw ?? undefined,
      startDate: item.startDate,
      endDate: item.endDate,
    }),
    reminderOn: meta.reminder === true,
    frequency: normalizeVaccinationFrequency(meta.frequency),
    reminderTime: timeHHmmToDate(meta.reminderTime ?? '09:00'),
    isRecurring: meta.isRecurring ?? false,
    recurrenceInterval: meta.recurrenceInterval ?? 'yearly',
    notes: meta.notes ?? item.notes ?? item.description ?? '',
    status: (item as any).status,
    isComplete: (item as any).isComplete,
  };
}

export function mapGroomingItem(item: GroomingRecord): GroomingEntryState {
  return {
    id: newEntryId(),
    recordId: item._id,
    groomingType: item.groomingType,
    scheduleDate: parseScheduleDateFromApi({
      date: item.scheduledDate ?? item.date ?? undefined,
      startDate: item.startDate ?? undefined,
      endDate: item.endDate ?? undefined,
    }),
    reminderOn: item.reminderEnabled === true,
    notes: item.notes ?? '',
    performedAt: item.performedAt ?? undefined,
  };
}

export function buildScheduleSectionsState(
  input: {
    feeding: FeedingScheduleItem[];
    walk: WalkScheduleItem[];
    medicine: MedicineScheduleItem[];
    vaccination: VaccinationScheduleItem[];
    grooming: GroomingRecord[];
  },
  disabledCategories: string[] = [],
): ScheduleSectionsState {
  // A category is enabled when it is NOT in the disabledCategories list.
  // If disabledCategories is empty (fresh/unset), fall back to enabling only
  // sections that actually have entries so empty sections start collapsed.
  const hasDisabledPreference = disabledCategories.length > 0;

  function isEnabled(key: ScheduleSectionKey, entries: unknown[]): boolean {
    if (disabledCategories.includes(key)) return false;
    if (hasDisabledPreference) return true;
    return entries.length > 0;
  }

  const feedingEntries = input.feeding.map(mapFeedingItem);
  const walkEntries = input.walk.map(mapWalkItem);
  const medicineEntries = input.medicine.map(mapMedicineItem);
  const vaccinationEntries = input.vaccination.map(mapVaccinationItem);
  const groomingEntries = input.grooming.map(mapGroomingItem);

  return {
    feeding: {
      enabled: isEnabled('feeding', feedingEntries),
      entries: feedingEntries,
    },
    walk: {
      enabled: isEnabled('walk', walkEntries),
      entries: walkEntries,
    },
    medicine: {
      enabled: isEnabled('medicine', medicineEntries),
      entries: medicineEntries,
    },
    vaccination: {
      enabled: isEnabled('vaccination', vaccinationEntries),
      entries: vaccinationEntries,
    },
    grooming: {
      enabled: isEnabled('grooming', groomingEntries),
      entries: groomingEntries,
    },
  };
}

import { getTaskDisplayName } from '@/lib/schedule/taskMappings';

type ScheduleEntry =
  | FeedingEntryState
  | WalkEntryState
  | MedicineEntryState
  | VaccinationEntryState
  | GroomingEntryState;

export function scheduleEntryTitle(key: ScheduleSectionKey, entry: ScheduleEntry): string {
  switch (key) {
    case 'feeding':
      return getTaskDisplayName((entry as FeedingEntryState).mealType) || 'Feeding';
    case 'walk': {
      const walk = entry as WalkEntryState;
      return `${getTaskDisplayName(walk.walkTime)} Walk`;
    }
    case 'medicine':
      return (entry as MedicineEntryState).medicineName.trim() || 'Medicine';
    case 'vaccination':
      return (entry as VaccinationEntryState).vaccineName.trim() || 'Vaccination';
    case 'grooming':
      return getTaskDisplayName((entry as GroomingEntryState).groomingType) || 'Grooming';
    default:
      return 'Schedule';
  }
}

export function scheduleEntrySubtitle(key: ScheduleSectionKey, entry: ScheduleEntry): string {
  switch (key) {
    case 'feeding': {
      const e = entry as FeedingEntryState;
      let portion = '';
      if (e.amount) {
        if (e.unit) {
          const num = parseFloat(e.amount);
          let uLabel = formatUnitLabel(e.unit);
          if (uLabel.toLowerCase() === 'cup' && num > 1) {
            uLabel = 'cups';
          }
          portion = `${e.amount} ${uLabel} · `;
        } else {
          portion = `${e.amount} · `;
        }
      }
      return `${portion}${formatTimeHHmmDisplay(dateToTimeHHmm(e.feedingTime))} · ${formatScheduleDateSummary(e.scheduleDate)}`;
    }
    case 'walk': {
      const e = entry as WalkEntryState;
      return `${e.duration} min · ${formatTimeDisplay(e.walkClockTime)} · ${formatScheduleDateSummary(e.scheduleDate)}`;
    }
    case 'medicine': {
      const e = entry as MedicineEntryState;
      const freq =
        e.frequency && e.frequency !== 'daily' ? `${getFrequencyLabel(e.frequency)} · ` : '';
      return `${freq}${formatTimeDisplay(e.medicineTime)} · ${formatScheduleDateSummary(e.scheduleDate)}`;
    }
    case 'vaccination': {
      const e = entry as VaccinationEntryState;
      return `${formatScheduleDateSummary(e.scheduleDate)} · ${reminderFrequencyLabel(e.frequency)}`;
    }
    case 'grooming': {
      const e = entry as GroomingEntryState;
      return formatScheduleDateSummary(e.scheduleDate);
    }
    default:
      return '';
  }
}

export function scheduleEntryRemoteId(key: ScheduleSectionKey, entry: ScheduleEntry): string | undefined {
  if (key === 'grooming') return (entry as GroomingEntryState).recordId;
  return (entry as FeedingEntryState).scheduleId;
}
