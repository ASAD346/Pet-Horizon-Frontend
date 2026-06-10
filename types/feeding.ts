export interface CreateFeedingScheduleRequest {
  petId: string;
  mealType: string;
  time: string;
  amount?: string;
  unit?: string;
  notes?: string;
  note?: string;
  reminder?: boolean;
  reminderTime?: string;
  reminderMinutes?: number;
}

export type FeedingScheduleStatus = 'pending' | 'done' | 'skipped';

export interface FeedingScheduleItem {
  _id: string;
  petId: string;
  category: 'feeding';
  title: string;
  timeOfDay: string;
  description?: string;
  notes?: string;
  reminderTime?: string;
  status?: FeedingScheduleStatus;
  completedAt?: string;
  isComplete?: boolean;
  reminderDue?: boolean;
  metadata?: {
    mealType?: string;
    amount?: string;
    unit?: string;
    notes?: string;
    reminder?: boolean;
    reminderTime?: string;
    reminderMinutes?: number;
  };
}

export interface CompleteFeedingRequest {
  status?: 'done' | 'skipped';
}

export interface UpdateFeedingScheduleRequest {
  mealType?: string;
  time?: string;
  amount?: string;
  unit?: string;
  notes?: string;
  note?: string;
  reminder?: boolean;
  reminderTime?: string;
  reminderMinutes?: number;
}

export interface CompleteFeedingResponse {
  scheduleLog: { _id: string; status: string; completedAt: string };
  journalCreated?: boolean;
}
