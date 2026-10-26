export type TimingMode = 'exact' | 'window';
export type WindowPreset = 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'custom' | '';
export type SwapStatus = 'none' | 'pending' | 'accepted' | 'declined' | 'expired' | 'escalated';
export type TaskCategory = 'feeding' | 'walk' | 'medicine' | 'grooming' | 'vaccination';

export interface TimeWindowConfig {
  preset: WindowPreset;
  startTime: string; // "11:30"
  endTime: string;   // "14:00"
  earlyAllowedMinutes?: number;
}

export interface TaskAssignment {
  userId: string | null;
  name: string;
  avatarUrl?: string;
  assignedAt?: string | null;
  assignedByUserId?: string | null;
}

export interface ActiveSwapRequest {
  isRequested: boolean;
  requestedByUserId: string | null;
  requestedByName: string;
  targetUserId: string | null;
  requestedAt?: string | null;
  note: string;
  status: SwapStatus;
  acceptedByUserId?: string | null;
  acceptedAt?: string | null;
}

export interface InProgressLock {
  isLocked: boolean;
  lockedByUserId: string | null;
  lockedByName: string;
  lockedAt: string | null;
  expiresAt: string | null;
}

export interface TaskCompletion {
  isCompleted: boolean;
  completedAt: string | null;
  status: 'pending' | 'done' | 'skipped' | 'missed';
  performedBy: {
    userId: string | null;
    name: string;
  };
  wasCovered: boolean;
  walkMetrics?: {
    durationMinutes: number;
    distanceKm: number;
  };
  notes?: string;
}

export interface DelegationTask {
  _id: string;
  scheduleItemId: string;
  petId: string;
  familyId?: string | null;
  occurrenceDate: string;
  category: TaskCategory;
  title: string;
  timingMode: TimingMode;
  exactTime: string;
  window: TimeWindowConfig;
  assignment: TaskAssignment;
  activeSwap: ActiveSwapRequest;
  inProgressLock: InProgressLock;
  completion: TaskCompletion;
  isMyTask?: boolean;
  isLockedByOther?: boolean;
  isLockedByMe?: boolean;
  canSwap?: boolean;
  canComplete?: boolean;
}

export interface MemberContribution {
  userId: string;
  name: string;
  avatarUrl?: string;
  minutesWalked: number;
  walksCount: number;
  feedingsCount: number;
  medicineCount: number;
  swapsHelpedCount: number;
  totalTasksCount: number;
  badge: string;
}

export interface FamilyGoalStats {
  petId: string;
  petName: string;
  walkingGoal: {
    weeklyTargetMinutes: number;
    weeklyTargetKm: number;
    dailyMinimumWalkCount: number;
    period: 'daily' | 'weekly';
  };
  currentWeekStats: {
    weekStartDate: string;
    totalMinutesWalked: number;
    totalKmWalked: number;
    totalTasksCompleted: number;
    goalProgressPercentage: number;
    adherencePercentage: number;
    memberBreakdown: MemberContribution[];
  };
  allTime: {
    totalMinutesWalked: number;
    totalTasksCompleted: number;
  };
}

export interface FamilyCaretaker {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  isOwner: boolean;
  isPremium: boolean;
}
