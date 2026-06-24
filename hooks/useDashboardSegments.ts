import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUnifiedDashboard } from '@/services/dashboard/dashboardApi';
import type { UnifiedDashboardData } from '@/types/dashboard';
import { completeFeedingSchedule, skipFeedingSchedule } from '@/services/schedules/feedingApi';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { completeMedicineSchedule } from '@/services/schedules/medicineApi';
import { completeGroomingRecord } from '@/services/grooming/groomingApi';
import { completeVaccinationSchedule } from '@/services/schedules/vaccinationApi';

// Hook for Pet Profile Segment
export function usePetProfileQuery(token: string | null, petId: string | null | undefined) {
  const [cached, setCached] = useState<any>(null);

  useEffect(() => {
    if (petId) {
      AsyncStorage.getItem(`@pet_profile_cache_${petId}`).then((val) => {
        if (val) {
          try { setCached(JSON.parse(val)); } catch {}
        }
      });
    }
  }, [petId]);

  const query = useQuery({
    queryKey: ['dashboard', 'profile', petId],
    queryFn: async () => {
      const data = await fetchUnifiedDashboard(token!);
      return data.activePet;
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ?? undefined,
  });

  useEffect(() => {
    if (query.data && petId) {
      AsyncStorage.setItem(`@pet_profile_cache_${petId}`, JSON.stringify(query.data));
    }
  }, [query.data, petId]);

  return query;
}

// Hook for Schedules Segment
export function useTodaySchedulesQuery(token: string | null, petId: string | null | undefined) {
  const [cached, setCached] = useState<any>(null);

  useEffect(() => {
    if (petId) {
      AsyncStorage.getItem(`@today_schedule_cache_${petId}`).then((val) => {
        if (val) {
          try { setCached(JSON.parse(val)); } catch {}
        }
      });
    }
  }, [petId]);

  const query = useQuery({
    queryKey: ['dashboard', 'schedules', petId],
    queryFn: async () => {
      const data = await fetchUnifiedDashboard(token!);
      return data.todaySchedules;
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ?? undefined,
  });

  useEffect(() => {
    if (query.data && petId) {
      AsyncStorage.setItem(`@today_schedule_cache_${petId}`, JSON.stringify(query.data));
    }
  }, [query.data, petId]);

  return query;
}

// Hook for Upcoming Tasks Segment
export function useUpcomingTasksQuery(token: string | null, petId: string | null | undefined) {
  const [cached, setCached] = useState<any>(null);

  useEffect(() => {
    if (petId) {
      AsyncStorage.getItem(`@upcoming_tasks_cache_${petId}`).then((val) => {
        if (val) {
          try { setCached(JSON.parse(val)); } catch {}
        }
      });
    }
  }, [petId]);

  const query = useQuery({
    queryKey: ['dashboard', 'upcomingTasks', petId],
    queryFn: async () => {
      const data = await fetchUnifiedDashboard(token!);
      return data.upcomingTasks;
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ?? undefined,
  });

  useEffect(() => {
    if (query.data && petId) {
      AsyncStorage.setItem(`@upcoming_tasks_cache_${petId}`, JSON.stringify(query.data));
    }
  }, [query.data, petId]);

  return query;
}

// Hook for Notifications Segment
export function useNotificationsQuery(token: string | null, petId: string | null | undefined) {
  const [cached, setCached] = useState<any>(null);

  useEffect(() => {
    if (petId) {
      AsyncStorage.getItem(`@notifications_cache_${petId}`).then((val) => {
        if (val) {
          try { setCached(JSON.parse(val)); } catch {}
        }
      });
    }
  }, [petId]);

  const query = useQuery({
    queryKey: ['dashboard', 'notifications', petId],
    queryFn: async () => {
      const data = await fetchUnifiedDashboard(token!);
      return data.notifications;
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ?? undefined,
  });

  useEffect(() => {
    if (query.data && petId) {
      AsyncStorage.setItem(`@notifications_cache_${petId}`, JSON.stringify(query.data));
    }
  }, [query.data, petId]);

  return query;
}

// Hook for Recent Activities Segment
export function useRecentActivitiesQuery(token: string | null, petId: string | null | undefined) {
  const [cached, setCached] = useState<any>(null);

  useEffect(() => {
    if (petId) {
      AsyncStorage.getItem(`@recent_activities_cache_${petId}`).then((val) => {
        if (val) {
          try { setCached(JSON.parse(val)); } catch {}
        }
      });
    }
  }, [petId]);

  const query = useQuery({
    queryKey: ['dashboard', 'recentActivities', petId],
    queryFn: async () => {
      const data = await fetchUnifiedDashboard(token!);
      return data.recentActivities;
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ?? undefined,
  });

  useEffect(() => {
    if (query.data && petId) {
      AsyncStorage.setItem(`@recent_activities_cache_${petId}`, JSON.stringify(query.data));
    }
  }, [query.data, petId]);

  return query;
}
