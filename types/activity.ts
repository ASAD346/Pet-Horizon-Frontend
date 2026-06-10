export type ActivityCategory =
  | 'food'
  | 'medicine'
  | 'grooming'
  | 'walk'
  | 'vaccination'
  | 'reminder'
  | 'custom';

export interface ActivityUserRef {
  _id: string;
  fullName?: string;
  profileImage?: string | null;
}

export interface ActivityEntry {
  _id: string;
  petId: string;
  createdByUserId: ActivityUserRef | string;
  category: ActivityCategory | string;
  title: string;
  description?: string;
  date: string;
  images?: string[];
  isCompleted?: boolean;
  completedAt?: string | null;
  completedByUserId?: ActivityUserRef | string | null;
  completionImages?: string[];
  completionNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityTimelineResponse {
  petId: string;
  date: string;
  totalEntries: number;
  completedEntries: number;
  categories: Record<string, ActivityEntry[]>;
  entries: ActivityEntry[];
}

export interface CreateActivityRequest {
  category: ActivityCategory | string;
  title: string;
  description?: string;
  date?: string;
}

export interface UpdateActivityRequest {
  category?: ActivityCategory | string;
  title?: string;
  description?: string;
  date?: string;
}
