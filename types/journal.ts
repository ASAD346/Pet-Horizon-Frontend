export interface ApiJournalEntry {
  _id: string;
  petId: string;
  userId: string;
  activityType: string;
  note: string;
  imagePath?: string | null;
  relatedScheduleLogId?: string | null;
  canUploadImage?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface JournalListResponse {
  items: ApiJournalEntry[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateJournalRequest {
  petId: string;
  activityType?: string;
  activity_type?: string;
  note?: string;
}
