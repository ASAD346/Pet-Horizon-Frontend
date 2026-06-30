import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { fetchUnifiedDashboard } from '@/services/dashboard/dashboardApi';
import type { UnifiedDashboardData } from '@/types/dashboard';

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

  const now = new Date();
  const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const query = useQuery({
    queryKey: ['dashboard', petId, localDateStr],
    queryFn: async () => {
      return fetchUnifiedDashboard(token!);
    },
    select: (data) => data.activePet,
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ? { activePet: cached } as any : undefined,
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

  const now = new Date();
  const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const query = useQuery({
    queryKey: ['dashboard', petId, localDateStr],
    queryFn: async () => {
      return fetchUnifiedDashboard(token!);
    },
    select: (data) => data.todaySchedules,
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ? { todaySchedules: cached } as any : undefined,
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

  const now = new Date();
  const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const query = useQuery({
    queryKey: ['dashboard', petId, localDateStr],
    queryFn: async () => {
      return fetchUnifiedDashboard(token!);
    },
    select: (data) => data.upcomingTasks,
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ? { upcomingTasks: cached } as any : undefined,
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

  const now = new Date();
  const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const query = useQuery({
    queryKey: ['dashboard', petId, localDateStr],
    queryFn: async () => {
      return fetchUnifiedDashboard(token!);
    },
    select: (data) => data.notifications,
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ? { notifications: cached } as any : undefined,
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

  const now = new Date();
  const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const query = useQuery({
    queryKey: ['dashboard', petId, localDateStr],
    queryFn: async () => {
      return fetchUnifiedDashboard(token!);
    },
    select: (data) => data.recentActivities,
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
    placeholderData: cached ? { recentActivities: cached } as any : undefined,
  });

  useEffect(() => {
    if (query.data && petId) {
      AsyncStorage.setItem(`@recent_activities_cache_${petId}`, JSON.stringify(query.data));
    }
  }, [query.data, petId]);

  return query;
}

