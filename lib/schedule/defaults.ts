import {
  addMinutesToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  defaultFeedingTimeDate,
  pickDefaultUnit,
} from '@/lib/feeding/feedingForm';
import {
  defaultMedicineTimeDate,
} from '@/lib/medicine/medicineForm';
import {
  defaultReminderTimeDate,
} from '@/lib/vaccination/vaccinationForm';
import { defaultWalkTimeDate, WALK_TIME_OPTIONS } from '@/lib/walk/walkForm';
import { createDefaultScheduleDate } from '@/lib/schedule/scheduleDate';
import type {
  FeedingEntryState,
  GroomingEntryState,
  MedicineEntryState,
  ScheduleSectionsState,
  VaccinationEntryState,
  WalkEntryState,
} from '@/lib/schedule/types';

let entryCounter = 0;

export function newEntryId(): string {
  entryCounter += 1;
  return `schedule-entry-${entryCounter}-${Date.now()}`;
}

export function createFeedingEntry(
  mealType = '',
  unit = '',
): FeedingEntryState {
  return {
    id: newEntryId(),
    mealType,
    amount: '2',
    unit,
    feedingTime: defaultFeedingTimeDate(),
    scheduleDate: createDefaultScheduleDate('ongoing'),
    notificationsOn: false,
    reminderMinutes: DEFAULT_REMINDER_MINUTES,
    notes: '',
  };
}

export function createWalkEntry(): WalkEntryState {
  return {
    id: newEntryId(),
    walkTime: WALK_TIME_OPTIONS[0].value,
    duration: '45',
    walkClockTime: defaultWalkTimeDate(),
    scheduleDate: createDefaultScheduleDate('ongoing'),
    notificationsOn: false,
    reminderMinutes: DEFAULT_REMINDER_MINUTES,
    notes: '',
  };
}

export function createMedicineEntry(): MedicineEntryState {
  return {
    id: newEntryId(),
    medicineName: '',
    doseAmount: '1',
    doseForm: 'tablet',
    frequency: 'daily',
    daysOfWeek: [],
    medicineTime: defaultMedicineTimeDate(),
    scheduleDate: createDefaultScheduleDate('ongoing'),
    totalPills: '30',
    reminderOn: false,
    reminderMinutes: DEFAULT_REMINDER_MINUTES,
    notes: '',
  };
}

export function createVaccinationEntry(): VaccinationEntryState {
  return {
    id: newEntryId(),
    vaccineName: '',
    scheduleDate: createDefaultScheduleDate('single'),
    reminderOn: false,
    frequency: '7_days',
    reminderTime: defaultReminderTimeDate(),
    isRecurring: false,
    recurrenceInterval: 'yearly',
    notes: '',
  };
}

export function createGroomingEntry(groomingType = ''): GroomingEntryState {
  return {
    id: newEntryId(),
    groomingType,
    scheduleDate: createDefaultScheduleDate('single'),
    reminderOn: false,
    notes: '',
  };
}

export function createInitialScheduleState(
  defaultMealType = '',
  defaultUnit = '',
  defaultGroomingType = '',
): ScheduleSectionsState {
  return {
    feeding: { enabled: false, entries: [] },
    walk: { enabled: false, entries: [] },
    medicine: { enabled: false, entries: [] },
    vaccination: { enabled: false, entries: [] },
    grooming: { enabled: false, entries: [] },
  };
}

export function pickDefaultUnitFromList(units: string[]): string {
  return pickDefaultUnit(units);
}

export { addMinutesToTimeHHmm };
