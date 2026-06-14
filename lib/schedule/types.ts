import type { DayOfWeekCode, MedicineDoseForm, MedicineFrequency } from '@/types/medicine';
import type { VaccinationRecurrenceInterval, VaccinationReminderFrequency } from '@/types/vaccination';

export type ScheduleSectionKey = 'feeding' | 'walk' | 'medicine' | 'vaccination' | 'grooming';

export interface FeedingEntryState {
  id: string;
  scheduleId?: string;
  mealType: string;
  amount: string;
  unit: string;
  feedingTime: Date;
  notificationsOn: boolean;
  reminderMinutes: number;
  notes: string;
}

export interface WalkEntryState {
  id: string;
  scheduleId?: string;
  walkTime: string;
  duration: string;
  walkClockTime: Date;
  notificationsOn: boolean;
  reminderMinutes: number;
  notes: string;
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
  startDate: Date | null;
  endDate: Date | null;
  totalPills: string;
  reminderOn: boolean;
  reminderMinutes: number;
  notes: string;
}

export interface VaccinationEntryState {
  id: string;
  scheduleId?: string;
  vaccineName: string;
  dueDate: Date | null;
  reminderOn: boolean;
  frequency: VaccinationReminderFrequency;
  reminderTime: Date;
  isRecurring: boolean;
  recurrenceInterval: VaccinationRecurrenceInterval;
  notes: string;
}

export interface GroomingEntryState {
  id: string;
  recordId?: string;
  groomingType: string;
  scheduledDate: Date | null;
  reminderOn: boolean;
  notes: string;
}

export interface ScheduleSectionsState {
  feeding: { enabled: boolean; entries: FeedingEntryState[] };
  walk: { enabled: boolean; entries: WalkEntryState[] };
  medicine: { enabled: boolean; entries: MedicineEntryState[] };
  vaccination: { enabled: boolean; entries: VaccinationEntryState[] };
  grooming: { enabled: boolean; entries: GroomingEntryState[] };
}
