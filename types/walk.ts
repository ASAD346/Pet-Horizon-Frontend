export interface CreateWalkScheduleRequest {
  petId: string;
  walkTime: string;
  time: string;
  duration?: number;
  notes?: string;
  note?: string;
  reminder?: boolean;
  reminderTime?: string;
  reminderMinutes?: number;
}

export type WalkScheduleStatus = 'pending' | 'done' | 'skipped';

export interface WalkScheduleItem {
  _id: string;
  petId: string;
  category: 'walk';
  title: string;
  timeOfDay: string;
  description?: string;
  notes?: string;
  reminderTime?: string;
  status?: WalkScheduleStatus;
  completedAt?: string;
  isComplete?: boolean;
  reminderDue?: boolean;
  metadata?: {
    walkTime?: string;
    duration?: number;
    notes?: string;
    reminder?: boolean;
    reminderTime?: string;
    reminderMinutes?: number;
  };
}

export interface CompleteWalkRequest {
  status?: 'done' | 'skipped';
}

export interface CompleteWalkResponse {
  scheduleLog: { _id: string; status: string; completedAt: string };
  journalCreated?: boolean;
}
