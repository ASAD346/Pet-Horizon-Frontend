export type VaccinationReminderFrequency =
  | '1_day'
  | '3_days'
  | '7_days'
  | '14_days'
  | '30_days'
  | 'on_due';

export type VaccinationRecurrenceInterval = 'yearly' | 'monthly' | 'weekly';

export interface CreateVaccinationScheduleRequest {
  petId: string;
  vaccineName: string;
  dueDate?: string;
  reminder?: boolean;
  frequency?: VaccinationReminderFrequency;
  reminderDays?: number;
  reminderTime?: string;
  isRecurring?: boolean;
  recurrenceInterval?: VaccinationRecurrenceInterval;
  notes?: string;
  note?: string;
  date?: string;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateVaccinationScheduleRequest {
  dueDate?: string;
  reminder?: boolean;
  frequency?: VaccinationReminderFrequency;
  reminderDays?: number;
  reminderTime?: string;
  notes?: string;
  note?: string;
  date?: string;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface VaccinationScheduleItem {
  _id: string;
  petId: string;
  category: 'vaccination';
  title: string;
  description?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  remainingDays?: number | null;
  reminderTime?: string;
  isActive?: boolean;
  recurrenceRule?: string;
  metadata?: {
    vaccineName?: string;
    dueDate?: string;
    frequency?: VaccinationReminderFrequency | string;
    reminder?: boolean;
    isRecurring?: boolean;
    recurrenceInterval?: VaccinationRecurrenceInterval;
    notes?: string;
    reminderTime?: string;
    administeredDate?: string;
    vetName?: string;
  };
}

export interface CompleteVaccinationRequest {
  administeredDate?: string;
  nextDueDate?: string;
  vetName?: string;
}

export interface CompleteVaccinationResponse {
  scheduleLog: { _id: string; status: string; completedAt: string };
  journalCreated?: boolean;
}

export interface VaccinationHistoryItem {
  vaccineName: string;
  administeredDate: string;
  vetName?: string;
  dueDate?: string;
  remainingDays?: number | null;
  notes?: string;
}
