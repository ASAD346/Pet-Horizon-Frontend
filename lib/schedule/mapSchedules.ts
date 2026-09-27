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
  const meta: any = item.metadata ?? {};
  let mealType = meta.mealType ?? (item as any).mealType ?? '';
  if (!mealType && item.title) {
    mealType = item.title.toLowerCase().replace(/\s+feeding$/i, '').trim();
  }
  const amount = meta.amount != null ? String(meta.amount) : ((item as any).amount != null ? String((item as any).amount) : '');
  const unit = meta.unit ?? (item as any).unit ?? '';
  const timeStr = item.timeOfDay || (item as any).time || meta.time || '08:00';

  return {
    id: newEntryId(),
    scheduleId: item._id,
    mealType,
    amount,
    unit,
    feedingTime: timeHHmmToDate(timeStr),
    scheduleDate: parseScheduleDateFromApi({
      date: (item as any).date ?? meta.date,
      startDate: (item as any).startDate ?? meta.startDate,
      endDate: (item as any).endDate ?? meta.endDate,
    }),
    notificationsOn: meta.reminder === true || (item as any).reminder === true,
    reminderMinutes: meta.reminderMinutes ?? (item as any).reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? (item as any).notes ?? item.description ?? '',
    status: (item as any).status,
    isComplete: (item as any).isComplete,
  };
}

export function mapWalkItem(item: WalkScheduleItem): WalkEntryState {
  const meta: any = item.metadata ?? {};
  const durationVal = meta.duration != null ? String(meta.duration) : ((item as any).duration != null ? String((item as any).duration) : '');
  const timeStr = item.timeOfDay || (item as any).time || meta.time || '08:00';

  return {
    id: newEntryId(),
    scheduleId: item._id,
    walkTime: meta.walkTime ?? (item as any).walkTime ?? 'morning',
    duration: durationVal,
    walkClockTime: timeHHmmToDate(timeStr),
    scheduleDate: parseScheduleDateFromApi({
      date: (item as any).date ?? meta.date,
      startDate: (item as any).startDate ?? meta.startDate,
      endDate: (item as any).endDate ?? meta.endDate,
    }),
    notificationsOn: meta.reminder === true || (item as any).reminder === true,
    reminderMinutes: meta.reminderMinutes ?? (item as any).reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? (item as any).notes ?? item.description ?? '',
    status: (item as any).status,
    isComplete: (item as any).isComplete,
  };
}

export function mapMedicineItem(item: MedicineScheduleItem): MedicineEntryState {
  const meta: any = item.metadata ?? {};
  const rawDose = meta.dose ?? (item as any).dose ?? '';
  const parsed = parseDoseString(rawDose);
  const timeStr = item.timeOfDay || (item as any).time || meta.time || '08:00';

  return {
    id: newEntryId(),
    scheduleId: item._id,
    medicineName: meta.medicineName ?? (item as any).medicineName ?? (item.title ? item.title.split(' - ')[0] : '') ?? '',
    doseAmount: meta.doseAmount != null ? String(meta.doseAmount) : ((item as any).doseAmount != null ? String((item as any).doseAmount) : (parsed.amount || '')),
    doseForm: meta.doseForm ?? (item as any).doseForm ?? parsed.doseForm ?? 'tablet',
    frequency: meta.frequency ?? (item as any).frequency ?? 'daily',
    daysOfWeek: meta.daysOfWeek ?? (item as any).daysOfWeek ?? [],
    medicineTime: timeHHmmToDate(timeStr),
    scheduleDate: parseScheduleDateFromApi({
      date: (item as any).date ?? meta.date,
      startDate: item.startDate ?? meta.startDate,
      endDate: item.endDate ?? meta.endDate,
    }),
    totalPills:
      meta.totalPills != null
        ? String(meta.totalPills)
        : (item as any).totalPills != null
          ? String((item as any).totalPills)
          : meta.remainingPills != null
            ? String(meta.remainingPills)
            : (item as any).remainingPills != null
              ? String((item as any).remainingPills)
              : undefined,
    reminderOn: meta.reminder === true || (item as any).reminder === true,
    reminderMinutes: meta.reminderMinutes ?? (item as any).reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    notes: meta.notes ?? (item as any).notes ?? item.description ?? '',
    status: (item as any).status,
    isComplete: (item as any).isComplete,
  };
}

export function mapVaccinationItem(item: VaccinationScheduleItem): VaccinationEntryState {
  const meta: any = item.metadata ?? {};
  const dueRaw = meta.dueDate ?? (item as any).dueDate ?? item.startDate ?? (item as any).date;
  const timeStr = meta.reminderTime ?? (item as any).reminderTime ?? item.reminderTime ?? '09:00';

  return {
    id: newEntryId(),
    scheduleId: item._id,
    vaccineName: meta.vaccineName ?? (item as any).vaccineName ?? (item as any).name ?? item.title ?? '',
    scheduleDate: parseScheduleDateFromApi({
      date: dueRaw ?? undefined,
      startDate: item.startDate ?? meta.startDate,
      endDate: item.endDate ?? meta.endDate,
    }),
    reminderOn: meta.reminder === true || (item as any).reminder === true,
    frequency: normalizeVaccinationFrequency(meta.frequency ?? (item as any).frequency),
    reminderTime: timeHHmmToDate(timeStr),
    isRecurring: meta.isRecurring === true || (item as any).isRecurring === true,
    recurrenceInterval: meta.recurrenceInterval ?? (item as any).recurrenceInterval ?? 'yearly',
    notes: meta.notes ?? (item as any).notes ?? item.description ?? '',
    status: (item as any).status,
    isComplete: (item as any).isComplete,
  };
}

export function mapGroomingItem(item: GroomingRecord): GroomingEntryState {
  return {
    id: newEntryId(),
    recordId: item._id,
    groomingType: item.groomingType ?? (item as any).type ?? '',
    scheduleDate: parseScheduleDateFromApi({
      date: item.scheduledDate ?? item.date ?? undefined,
      startDate: item.startDate ?? undefined,
      endDate: item.endDate ?? undefined,
    }),
    reminderOn: item.reminderEnabled === true || (item as any).reminder === true,
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

  const deduplicateByIdOrKey = <T>(
    array: T[],
    idFn: (item: T) => string | undefined,
    keyFn: (item: T) => string
  ): T[] => {
    const seen = new Set<string>();
    return array.filter((item) => {
      const id = idFn(item);
      if (id) {
        if (seen.has(id)) return false;
        seen.add(id);
      }
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const feedingEntries = deduplicateByIdOrKey(
    input.feeding.map(mapFeedingItem),
    (e) => e.scheduleId,
    (e) => `${e.mealType || ''}-${dateToTimeHHmm(e.feedingTime)}-${e.amount || ''}-${e.unit || ''}`
  );

  const walkEntries = deduplicateByIdOrKey(
    input.walk.map(mapWalkItem),
    (e) => e.scheduleId,
    (e) => `${dateToTimeHHmm(e.walkClockTime)}-${e.duration || ''}`
  );

  const medicineEntries = deduplicateByIdOrKey(
    input.medicine.map(mapMedicineItem),
    (e) => e.scheduleId,
    (e) => `${dateToTimeHHmm(e.medicineTime)}-${e.medicineName || ''}-${e.doseAmount || ''}-${e.doseForm || ''}`
  );

  const vaccinationEntries = deduplicateByIdOrKey(
    input.vaccination.map(mapVaccinationItem),
    (e) => e.scheduleId,
    (e) => `${e.vaccineName || ''}-${e.scheduleDate?.singleDate || e.scheduleDate?.startDate || ''}`
  );

  const groomingEntries = deduplicateByIdOrKey(
    input.grooming.map(mapGroomingItem),
    (e) => e.recordId,
    (e) => `${e.groomingType || ''}-${e.scheduleDate?.singleDate || e.scheduleDate?.startDate || ''}`
  );

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

import { getTaskDisplayName } from '@/src/utils/taskMappings';

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
      const durText = e.duration ? `${e.duration} min · ` : '';
      return `${durText}${formatTimeDisplay(e.walkClockTime)} · ${formatScheduleDateSummary(e.scheduleDate)}`;
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
