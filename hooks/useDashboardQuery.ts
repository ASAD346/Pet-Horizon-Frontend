import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UnifiedDashboardData } from '@/types/dashboard';
import { fetchUnifiedDashboard } from '@/services/dashboard/dashboardApi';
import { completeFeedingSchedule, skipFeedingSchedule } from '@/services/schedules/feedingApi';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { completeMedicineSchedule } from '@/services/schedules/medicineApi';
import { completeGroomingRecord } from '@/services/grooming/groomingApi';
import { completeVaccinationSchedule } from '@/services/schedules/vaccinationApi';
import { useToast } from '@/hooks/useToast';

export function useDashboardQuery(token: string | null, petId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [cachedData, setCachedData] = useState<UnifiedDashboardData | undefined>(undefined);

  // Load merged placeholder data from AsyncStorage when petId changes
  useEffect(() => {
    if (!petId) {
      setCachedData(undefined);
      return;
    }
    const loadCache = async () => {
      try {
        const [profile, schedules, tasks, notifications, activities] = await Promise.all([
          AsyncStorage.getItem(`@pet_profile_cache_${petId}`),
          AsyncStorage.getItem(`@today_schedule_cache_${petId}`),
          AsyncStorage.getItem(`@upcoming_tasks_cache_${petId}`),
          AsyncStorage.getItem(`@notifications_cache_${petId}`),
          AsyncStorage.getItem(`@recent_activities_cache_${petId}`),
        ]);

        setCachedData({
          activePet: profile ? JSON.parse(profile) : null,
          todaySchedules: schedules ? JSON.parse(schedules) : { feeding: [], walk: [], medicine: [], grooming: [], vaccination: [] },
          upcomingTasks: tasks ? JSON.parse(tasks) : [],
          notifications: notifications ? JSON.parse(notifications) : { unreadCount: 0, list: [] },
          recentActivities: activities ? JSON.parse(activities) : [],
        });
      } catch (e) {
        // Fail silently
      }
    };
    void loadCache();
  }, [petId]);

  const query = useQuery({
    queryKey: ['dashboard', petId],
    queryFn: async () => {
      console.log('[useDashboardQuery] Fetching dashboard from API...');
      return fetchUnifiedDashboard(token!);
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 5,
  });

  // Save each segment back to AsyncStorage on successful query load
  useEffect(() => {
    if (query.data && petId) {
      console.log('[useDashboardQuery] Dashboard loaded successfully. Data keys:', Object.keys(query.data));
      const data = query.data;
      void Promise.all([
        data.activePet ? AsyncStorage.setItem(`@pet_profile_cache_${petId}`, JSON.stringify(data.activePet)) : Promise.resolve(),
        data.todaySchedules ? AsyncStorage.setItem(`@today_schedule_cache_${petId}`, JSON.stringify(data.todaySchedules)) : Promise.resolve(),
        data.upcomingTasks ? AsyncStorage.setItem(`@upcoming_tasks_cache_${petId}`, JSON.stringify(data.upcomingTasks)) : Promise.resolve(),
        data.notifications ? AsyncStorage.setItem(`@notifications_cache_${petId}`, JSON.stringify(data.notifications)) : Promise.resolve(),
        data.recentActivities ? AsyncStorage.setItem(`@recent_activities_cache_${petId}`, JSON.stringify(data.recentActivities)) : Promise.resolve(),
      ]);
    }
  }, [query.data, petId]);

  if (query.error) {
    console.error('[useDashboardQuery] Query error:', query.error);
  }

  const isLoading = query.isLoading && !cachedData;
  const isFetching = query.isFetching;
  const error = query.error;
  const data = query.data || cachedData;

  const refetch = useCallback(async () => {
    return query.refetch();
  }, [query.refetch]);

  // Mutator helper for updating a schedule item status optimistically in the cached todaySchedules
  const updateCacheScheduleStatus = (
    prev: any,
    category: 'feeding' | 'walk' | 'medicine' | 'grooming' | 'vaccination',
    itemId: string,
    status: 'done' | 'skipped' | 'pending'
  ): any => {
    if (!prev || !prev.todaySchedules) return prev;
    const todaySchedules = { ...prev.todaySchedules };
    if (todaySchedules[category]) {
      todaySchedules[category] = (todaySchedules[category] as any[]).map((item) =>
        item._id === itemId || item.id === itemId
          ? {
              ...item,
              status,
              isComplete: status === 'done',
              completedAt: status === 'done' ? new Date().toISOString() : undefined,
            }
          : item
      );
    }
    return {
      ...prev,
      todaySchedules,
    };
  };

  const addCacheRecentActivity = (
    prev: any,
    activityType: string,
    note: string
  ): any => {
    if (!prev) return prev;
    const recentActivities = prev.recentActivities ? [...prev.recentActivities] : [];
    
    const newActivity = {
      _id: `temp-${Date.now()}`,
      activityType,
      note,
      createdAt: new Date().toISOString(),
      userId: {
        _id: 'current-user',
        fullName: 'You'
      }
    };
    
    recentActivities.unshift(newActivity);
    
    return {
      ...prev,
      recentActivities: recentActivities.slice(0, 20),
    };
  };

  const findItemTitle = (prev: any, category: string, itemId: string, fallback: string): string => {
    if (!prev || !prev.todaySchedules || !prev.todaySchedules[category]) return fallback;
    const item = (prev.todaySchedules[category] as any[]).find((s) => s._id === itemId || s.id === itemId);
    return item ? (item.title || item.name || fallback) : fallback;
  };

  const removeCacheUpcomingTask = (prev: any, taskId: string): any => {
    if (!prev || !prev.upcomingTasks) return prev;
    return {
      ...prev,
      upcomingTasks: (prev.upcomingTasks as any[]).filter(
        (task) => task.id !== taskId && task._id !== taskId
      ),
    };
  };

  // 1. Feeding Complete Mutation
  const completeFeedingMutation = useMutation({
    mutationFn: (scheduleId: string) => completeFeedingSchedule(token!, scheduleId, { status: 'done' }),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId]);
      let itemTitle = 'Feeding';
      queryClient.setQueryData(['dashboard', petId], (prev: any) => {
        let updated = updateCacheScheduleStatus(prev, 'feeding', scheduleId, 'done');
        updated = removeCacheUpcomingTask(updated, scheduleId);
        itemTitle = findItemTitle(prev, 'feeding', scheduleId, 'Feeding');
        return addCacheRecentActivity(updated, 'Feeding', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
    },
  });

  // 2. Feeding Skip Mutation
  const skipFeedingMutation = useMutation({
    mutationFn: (scheduleId: string) => skipFeedingSchedule(token!, scheduleId),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId]);
      let itemTitle = 'Feeding';
      queryClient.setQueryData(['dashboard', petId], (prev: any) => {
        let updated = updateCacheScheduleStatus(prev, 'feeding', scheduleId, 'skipped');
        updated = removeCacheUpcomingTask(updated, scheduleId);
        itemTitle = findItemTitle(prev, 'feeding', scheduleId, 'Feeding');
        return addCacheRecentActivity(updated, 'Feeding', `skipped ${itemTitle}`);
      });
      showToast(`${itemTitle} skipped successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
    },
  });

  // 3. Walk Complete Mutation
  const completeWalkMutation = useMutation({
    mutationFn: (scheduleId: string) => completeWalkSchedule(token!, scheduleId, { status: 'done' }),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId]);
      let itemTitle = 'Walk';
      queryClient.setQueryData(['dashboard', petId], (prev: any) => {
        let updated = updateCacheScheduleStatus(prev, 'walk', scheduleId, 'done');
        updated = removeCacheUpcomingTask(updated, scheduleId);
        itemTitle = findItemTitle(prev, 'walk', scheduleId, 'Walk');
        return addCacheRecentActivity(updated, 'Walk', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
    },
  });

  // 4. Medicine Complete Mutation
  const completeMedicineMutation = useMutation({
    mutationFn: (scheduleId: string) => completeMedicineSchedule(token!, scheduleId, { status: 'done' }),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId]);
      let itemTitle = 'Medicine';
      queryClient.setQueryData(['dashboard', petId], (prev: any) => {
        let updated = updateCacheScheduleStatus(prev, 'medicine', scheduleId, 'done');
        updated = removeCacheUpcomingTask(updated, scheduleId);
        itemTitle = findItemTitle(prev, 'medicine', scheduleId, 'Medicine');
        return addCacheRecentActivity(updated, 'Medicine', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
    },
  });

  // 5. Grooming Complete Mutation
  const completeGroomingMutation = useMutation({
    mutationFn: (recordId: string) => completeGroomingRecord(token!, recordId),
    onMutate: async (recordId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId]);
      let itemTitle = 'Grooming';
      queryClient.setQueryData(['dashboard', petId], (prev: any) => {
        let updated = updateCacheScheduleStatus(prev, 'grooming', recordId, 'done');
        updated = removeCacheUpcomingTask(updated, recordId);
        itemTitle = findItemTitle(prev, 'grooming', recordId, 'Grooming');
        return addCacheRecentActivity(updated, 'Grooming', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, recordId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
    },
  });

  // 6. Vaccination Complete Mutation
  const completeVaccinationMutation = useMutation({
    mutationFn: (scheduleId: string) => completeVaccinationSchedule(token!, scheduleId),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId]);
      let itemTitle = 'Vaccination';
      queryClient.setQueryData(['dashboard', petId], (prev: any) => {
        let updated = updateCacheScheduleStatus(prev, 'vaccination', scheduleId, 'done');
        updated = removeCacheUpcomingTask(updated, scheduleId);
        itemTitle = findItemTitle(prev, 'vaccination', scheduleId, 'Vaccination');
        return addCacheRecentActivity(updated, 'Vaccination', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
    },
  });

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    completeFeeding: completeFeedingMutation.mutateAsync,
    skipFeeding: skipFeedingMutation.mutateAsync,
    completeWalk: completeWalkMutation.mutateAsync,
    completeMedicine: completeMedicineMutation.mutateAsync,
    completeGrooming: completeGroomingMutation.mutateAsync,
    completeVaccination: completeVaccinationMutation.mutateAsync,
  };
}
