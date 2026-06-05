import {
  addMinutesToTimeHHmm,
  DEFAULT_REMINDER_MINUTES,
  defaultFeedingTimeDate,
  pickDefaultUnit,
} from '@/lib/feeding/feedingForm';
import { defaultScheduledDate } from '@/lib/grooming/groomingForm';
import {
  defaultMedicineTimeDate,
} from '@/lib/medicine/medicineForm';
import {
  defaultDueDate,
  defaultReminderTimeDate,
} from '@/lib/vaccination/vaccinationForm';
import { defaultWalkTimeDate, WALK_TIME_OPTIONS } from '@/lib/walk/walkForm';
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
    notificationsOn: true,
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
    notificationsOn: true,
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
    startDate: null,
    endDate: null,
    totalPills: '30',
    reminderOn: true,
    reminderMinutes: DEFAULT_REMINDER_MINUTES,
    notes: '',
  };
}

export function createVaccinationEntry(): VaccinationEntryState {
  return {
    id: newEntryId(),
    vaccineName: '',
    dueDate: defaultDueDate(),
    reminderOn: true,
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
    scheduledDate: defaultScheduledDate(),
    reminderOn: true,
    notes: '',
  };
}

export function createInitialScheduleState(
  defaultMealType = '',
  defaultUnit = '',
  defaultGroomingType = '',
): ScheduleSectionsState {
  return {
    feeding: { enabled: false, entries: [createFeedingEntry(defaultMealType, defaultUnit)] },
    walk: { enabled: false, entries: [createWalkEntry()] },
    medicine: { enabled: false, entries: [createMedicineEntry()] },
    vaccination: { enabled: false, entries: [createVaccinationEntry()] },
    grooming: { enabled: false, entries: [createGroomingEntry(defaultGroomingType)] },
  };
}

export function pickDefaultUnitFromList(units: string[]): string {
  return pickDefaultUnit(units);
}

export { addMinutesToTimeHHmm };
