export interface ApiNotification {
  _id: string;
  userId: string;
  petId?: string | null;
  relatedScheduleItemId?: string | null;
  title: string;
  body?: string;
  type?: string;
  isRead: boolean;
  readAt?: string | null;
  scheduledFor?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
