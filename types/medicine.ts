export type MedicineDoseForm = 'tablet' | 'syrup';

export type MedicineFrequency = 'daily' | 'weekly' | 'monthly';

export type DayOfWeekCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export interface CreateMedicineScheduleRequest {
  petId: string;
  medicineName: string;
  dose: string;
  time: string;
  doseForm?: MedicineDoseForm;
  frequency?: MedicineFrequency;
  daysOfWeek?: DayOfWeekCode[];
  totalPills?: number;
  remainingPills?: number;
  lowStockThreshold?: number;
  notes?: string;
  note?: string;
  reminder?: boolean;
  reminderTime?: string;
  reminderMinutes?: number;
  startDate?: string;
  endDate?: string;
}

export type MedicineScheduleStatus = 'pending' | 'done' | 'skipped';

export interface MedicineScheduleItem {
  _id: string;
  petId: string;
  category: 'medicine';
  title: string;
  timeOfDay: string;
  description?: string;
  notes?: string;
  reminderTime?: string;
  status?: MedicineScheduleStatus;
  completedAt?: string;
  isComplete?: boolean;
  reminderDue?: boolean;
  isActivePeriod?: boolean;
  startDate?: string;
  endDate?: string;
  metadata?: {
    medicineName?: string;
    dose?: string;
    doseForm?: MedicineDoseForm;
    frequency?: MedicineFrequency;
    daysOfWeek?: DayOfWeekCode[];
    totalPills?: number;
    remainingPills?: number;
    lowStockThreshold?: number;
    notes?: string;
    reminder?: boolean;
    reminderTime?: string;
    reminderMinutes?: number;
    groupId?: string;
  };
}

export interface UpdateMedicineScheduleRequest {
  dose?: string;
  time?: string;
  doseForm?: MedicineDoseForm;
  remainingPills?: number;
  startDate?: string;
  endDate?: string;
  lowStockThreshold?: number;
  notes?: string;
  note?: string;
  reminder?: boolean;
  reminderTime?: string;
  reminderMinutes?: number;
}

export interface RefillMedicineRequest {
  additionalPills: number;
}

export interface MedicineHistoryEntry {
  date: string;
  completedBy?: string;
}

export interface CompleteMedicineRequest {
  status?: 'done' | 'skipped';
}

export interface CompleteMedicineResponse {
  scheduleLog: { _id: string; status: string; completedAt: string };
  journalCreated?: boolean;
}
