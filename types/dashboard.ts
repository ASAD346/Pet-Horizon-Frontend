import type { FeedingScheduleItem } from './feeding';
import type { WalkScheduleItem } from './walk';
import type { MedicineScheduleItem } from './medicine';
import type { GroomingRecord } from './grooming';
import type { VaccinationScheduleItem } from './vaccination';
import type { ApiNotification } from './notification';

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

export interface UnifiedDashboardData {
  activePet: DashboardStatus | null;
  todaySchedules: {
    feeding: FeedingScheduleItem[];
    walk: WalkScheduleItem[];
    medicine: MedicineScheduleItem[];
    grooming: GroomingRecord[];
    vaccination: VaccinationScheduleItem[];
  };
  upcomingTasks: DashboardTask[];
  notifications: {
    unreadCount: number;
    list: ApiNotification[];
  };
  recentActivities: any[];
}
