import type { DayOfWeekCode, MedicineDoseForm, MedicineFrequency } from '@/types/medicine';
import type { VaccinationRecurrenceInterval, VaccinationReminderFrequency } from '@/types/vaccination';
import type { ScheduleDateState } from '@/lib/schedule/scheduleDate';

export type ScheduleSectionKey = 'feeding' | 'walk' | 'medicine' | 'vaccination' | 'grooming';

export interface FeedingEntryState {
  id: string;
  scheduleId?: string;
  mealType: string;
  amount: string;
  unit: string;
  feedingTime: Date;
  scheduleDate: ScheduleDateState;
  notificationsOn: boolean;
  reminderMinutes: number;
  notes: string;
  status?: string;
  isComplete?: boolean;
}

export interface WalkEntryState {
  id: string;
  scheduleId?: string;
  walkTime: string;
  duration: string;
  walkClockTime: Date;
  scheduleDate: ScheduleDateState;
  notificationsOn: boolean;
  reminderMinutes: number;
  notes: string;
  status?: string;
  isComplete?: boolean;
}

export interface MedicineEntryState {
  id: string;
  scheduleId?: string;
  medicineName: string;
  doseAmount: string;
  doseForm: MedicineDoseForm;
  frequency: MedicineFrequency;
  daysOfWeek: DayOfWeekCode[];
  medicineTime: Date;
  scheduleDate: ScheduleDateState;
  totalPills: string;
  reminderOn: boolean;
  reminderMinutes: number;
  notes: string;
  status?: string;
  isComplete?: boolean;
}

export interface VaccinationEntryState {
  id: string;
  scheduleId?: string;
  vaccineName: string;
  scheduleDate: ScheduleDateState;
  reminderOn: boolean;
  frequency: VaccinationReminderFrequency;
  reminderTime: Date;
  isRecurring: boolean;
  recurrenceInterval: VaccinationRecurrenceInterval;
  notes: string;
  status?: string;
  isComplete?: boolean;
}

export interface GroomingEntryState {
  id: string;
  recordId?: string;
  groomingType: string;
  scheduleDate: ScheduleDateState;
  reminderOn: boolean;
  notes: string;
  status?: string;
  isComplete?: boolean;
  performedAt?: string;
}

export interface ScheduleSectionsState {
  feeding: { enabled: boolean; entries: FeedingEntryState[] };
  walk: { enabled: boolean; entries: WalkEntryState[] };
  medicine: { enabled: boolean; entries: MedicineEntryState[] };
  vaccination: { enabled: boolean; entries: VaccinationEntryState[] };
  grooming: { enabled: boolean; entries: GroomingEntryState[] };
}
