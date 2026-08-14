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
  date?: string;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
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
  duration?: number | null;
  isComplete?: boolean;
  reminderDue?: boolean;
  metadata?: {
    walkTime?: string;
    duration?: number;
    notes?: string;
    reminder?: boolean;
    reminderTime?: string;
    reminderMinutes?: number;
    /** Set when any family member starts a walk. Cleared on complete/skip. */
    activeSession?: {
      userId: string;
      userName: string;
      startedAt: number;
    } | null;
  };
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface CompleteWalkRequest {
  status?: 'done' | 'skipped';
  date?: string;
  completedAt?: string;
  duration?: number;
}

export interface CompleteWalkResponse {
  scheduleLog: { _id: string; status: string; completedAt: string };
  journalCreated?: boolean;
}
