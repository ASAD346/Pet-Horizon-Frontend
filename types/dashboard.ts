export interface DashboardStatus {
  petId: string;
  name: string;
  photoUrl?: string | null;
  species?: string;
  breed?: string;
  gender?: string;
  age?: number | null;
  birthday?: string | null;
  weight?: number | null;
  weightUnit?: string;
  isPremium: boolean;
  plan: string;
  planExpiresAt?: string | null;
}

export interface DashboardTask {
  source: 'schedule' | 'grooming' | string;
  id: string;
  category?: string;
  title: string;
  timeOfDay?: string;
  scheduledDate?: string;
}
