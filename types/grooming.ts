export interface GroomingTypeOption {
  value: string;
  label: string;
}

export interface GroomingTypesResponse {
  petId: string;
  petName: string;
  species: string;
  groomingVisible: boolean;
  types: GroomingTypeOption[];
  groomingTypes: string[];
}

export interface CreateGroomingRequest {
  petId: string;
  type: string;
  scheduledDate?: string;
  reminder?: boolean;
  notes?: string;
  date?: string;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateGroomingRequest {
  type?: string;
  groomingType?: string;
  scheduledDate?: string | null;
  nextDueDate?: string | null;
  notes?: string;
  reminder?: boolean;
  reminderEnabled?: boolean;
  date?: string;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
}

export type GroomingAlertType = 'upcoming' | 'due_today' | 'overdue';

export interface GroomingRecord {
  _id: string;
  petId: string;
  groomingType: string;
  scheduledDate?: string | null;
  date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  performedAt?: string | null;
  nextDueDate?: string | null;
  notes?: string;
  reminderEnabled?: boolean;
  remainingDays?: number | null;
  alertType?: GroomingAlertType;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompleteGroomingResponse extends GroomingRecord {}
