export interface HealthMetric {
  _id: string;
  petId: string;
  date: string;
  weightKg?: number | null;
  activityMinutes?: number | null;
  sleepHours?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHealthRequest {
  petId: string;
  date: string;
  weightKg?: number | null;
  activityMinutes?: number | null;
  sleepHours?: number | null;
}

export interface UpdateHealthRequest {
  date?: string;
  weightKg?: number | null;
  activityMinutes?: number | null;
  sleepHours?: number | null;
}
