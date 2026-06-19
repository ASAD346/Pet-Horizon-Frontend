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
import { formatDateLabel } from '@/lib/medicine/medicineForm';
import {
  getFrequencyLabel,
  parseDoseString,
} from '@/lib/medicine/medicineForm';
import {
  reminderFrequencyLabel,
} from '@/lib/vaccination/vaccinationForm';
import { getWalkTimeLabel } from '@/lib/walk/walkForm';
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
    notificationsOn: meta.reminder === true,
    reminderMinutes: meta.reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? item.notes ?? item.description ?? '',
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
    notificationsOn: meta.reminder === true,
    reminderMinutes: meta.reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? item.notes ?? item.description ?? '',
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
    startDate: apiDateStringToDate(item.startDate),
    endDate: apiDateStringToDate(item.endDate),
    totalPills:
      meta.totalPills != null
        ? String(meta.totalPills)
        : meta.remainingPills != null
          ? String(meta.remainingPills)
          : '30',
    reminderOn: meta.reminder === true,
    reminderMinutes: meta.reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? item.notes ?? item.description ?? '',
  };
}

export function mapVaccinationItem(item: VaccinationScheduleItem): VaccinationEntryState {
  const meta = item.metadata ?? {};
  const dueRaw = meta.dueDate ?? item.startDate;
  return {
    id: newEntryId(),
    scheduleId: item._id,
    vaccineName: meta.vaccineName ?? item.title ?? '',
    dueDate: apiDateStringToDate(dueRaw ?? undefined),
    reminderOn: meta.reminder === true,
    frequency: normalizeVaccinationFrequency(meta.frequency),
    reminderTime: timeHHmmToDate(meta.reminderTime ?? '09:00'),
    isRecurring: meta.isRecurring ?? false,
    recurrenceInterval: meta.recurrenceInterval ?? 'yearly',
    notes: meta.notes ?? item.notes ?? item.description ?? '',
  };
}

export function mapGroomingItem(item: GroomingRecord): GroomingEntryState {
  return {
    id: newEntryId(),
    recordId: item._id,
    groomingType: item.groomingType,
    scheduledDate: apiDateStringToDate(item.scheduledDate ?? undefined),
    reminderOn: item.reminderEnabled === true,
    notes: item.notes ?? '',
  };
}

export function buildScheduleSectionsState(input: {
  feeding: FeedingScheduleItem[];
  walk: WalkScheduleItem[];
  medicine: MedicineScheduleItem[];
  vaccination: VaccinationScheduleItem[];
  grooming: GroomingRecord[];
}): ScheduleSectionsState {
  return {
    feeding: {
      enabled: input.feeding.length > 0,
      entries: input.feeding.map(mapFeedingItem),
    },
    walk: {
      enabled: input.walk.length > 0,
      entries: input.walk.map(mapWalkItem),
    },
    medicine: {
      enabled: input.medicine.length > 0,
      entries: input.medicine.map(mapMedicineItem),
    },
    vaccination: {
      enabled: input.vaccination.length > 0,
      entries: input.vaccination.map(mapVaccinationItem),
    },
    grooming: {
      enabled: input.grooming.length > 0,
      entries: input.grooming.map(mapGroomingItem),
    },
  };
}

type ScheduleEntry =
  | FeedingEntryState
  | WalkEntryState
  | MedicineEntryState
  | VaccinationEntryState
  | GroomingEntryState;

export function scheduleEntryTitle(key: ScheduleSectionKey, entry: ScheduleEntry): string {
  switch (key) {
    case 'feeding':
      return getMealTypeLabel((entry as FeedingEntryState).mealType) || 'Feeding';
    case 'walk': {
      const walk = entry as WalkEntryState;
      return `${getWalkTimeLabel(walk.walkTime)} Walk`;
    }
    case 'medicine':
      return (entry as MedicineEntryState).medicineName.trim() || 'Medicine';
    case 'vaccination':
      return (entry as VaccinationEntryState).vaccineName.trim() || 'Vaccination';
    case 'grooming':
      return groomingTypeLabel((entry as GroomingEntryState).groomingType) || 'Grooming';
    default:
      return 'Schedule';
  }
}

export function scheduleEntrySubtitle(key: ScheduleSectionKey, entry: ScheduleEntry): string {
  switch (key) {
    case 'feeding': {
      const e = entry as FeedingEntryState;
      const portion =
        e.amount && e.unit
          ? `${e.amount} ${formatUnitLabel(e.unit)} · `
          : e.amount
            ? `${e.amount} · `
            : '';
      return `${portion}${formatTimeHHmmDisplay(dateToTimeHHmm(e.feedingTime))}`;
    }
    case 'walk': {
      const e = entry as WalkEntryState;
      return `${e.duration} min · ${formatTimeDisplay(e.walkClockTime)}`;
    }
    case 'medicine': {
      const e = entry as MedicineEntryState;
      const freq =
        e.frequency && e.frequency !== 'daily' ? `${getFrequencyLabel(e.frequency)} · ` : '';
      return `${freq}${formatTimeDisplay(e.medicineTime)}`;
    }
    case 'vaccination': {
      const e = entry as VaccinationEntryState;
      const due = e.dueDate ? formatDateLabel(e.dueDate) : 'No due date';
      return `${due} · ${reminderFrequencyLabel(e.frequency)}`;
    }
    case 'grooming': {
      const e = entry as GroomingEntryState;
      return e.scheduledDate ? formatDateLabel(e.scheduledDate) : 'No date set';
    }
    default:
      return '';
  }
}

export function scheduleEntryRemoteId(key: ScheduleSectionKey, entry: ScheduleEntry): string | undefined {
  if (key === 'grooming') return (entry as GroomingEntryState).recordId;
  return (entry as FeedingEntryState).scheduleId;
}
