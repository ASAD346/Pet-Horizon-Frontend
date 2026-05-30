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

export interface FeedingScheduleItem {
  _id: string;
  petId: string;
  category: 'feeding';
  title: string;
  timeOfDay: string;
  description?: string;
  notes?: string;
  reminderTime?: string;
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
