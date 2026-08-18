import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UnifiedDashboardData } from '@/types/dashboard';
import { fetchUnifiedDashboard } from '@/services/dashboard/dashboardApi';
import { completeFeedingSchedule, skipFeedingSchedule } from '@/services/schedules/feedingApi';
import { completeWalkSchedule, startWalkSession as startWalkSessionApi } from '@/services/schedules/walkApi';
import { completeMedicineSchedule } from '@/services/schedules/medicineApi';
import { completeGroomingRecord } from '@/services/grooming/groomingApi';
import { completeVaccinationSchedule } from '@/services/schedules/vaccinationApi';
import { useToast } from '@/hooks/useToast';
import { deduplicateSchedules as globalDeduplicate } from '@/lib/schedule/scheduleUtils';
import { cancelTaskNotifications, cleanupPendingNotifications } from '@/lib/push/notificationSetup';

const deduplicateSchedules = (schedulesObj: any) => {
  if (!schedulesObj) return schedulesObj;
  const result = { ...schedulesObj };
  for (const category of Object.keys(result)) {
    const list = result[category];
    if (Array.isArray(list)) {
      result[category] = globalDeduplicate(list);
    }
  }
  return result;
};

export function useDashboardQuery(token: string | null, petId: string | null | undefined, isSwitching: boolean = false) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [cachedData, setCachedData] = useState<UnifiedDashboardData | undefined>(undefined);
  const [cachedPetId, setCachedPetId] = useState<string | null>(null);

  // Load merged placeholder data from AsyncStorage when petId changes
  useEffect(() => {
    if (!petId || petId === 'fallback-pet-id-123') {
      setCachedData(undefined);
      setCachedPetId(null);
      return;
    }
    const loadCache = async () => {
      try {
        const [profile, schedules, tasks, notifications, activities, timestamp] = await Promise.all([
          AsyncStorage.getItem(`@pet_profile_cache_${petId}`),
          AsyncStorage.getItem(`@today_schedule_cache_${petId}`),
          AsyncStorage.getItem(`@upcoming_tasks_cache_${petId}`),
          AsyncStorage.getItem(`@notifications_cache_${petId}`),
          AsyncStorage.getItem(`@recent_activities_cache_${petId}`),
          AsyncStorage.getItem(`@today_schedule_cache_timestamp_${petId}`),
        ]);

        const todayString = new Date().toDateString();
        const isCacheValid = timestamp === todayString;

        setCachedData({
          activePet: profile ? JSON.parse(profile) : null,
          todaySchedules: (schedules && isCacheValid) 
            ? JSON.parse(schedules) 
            : { feeding: [], walk: [], medicine: [], grooming: [], vaccination: [] },
          upcomingTasks: tasks ? JSON.parse(tasks) : [],
          notifications: notifications ? JSON.parse(notifications) : { unreadCount: 0, list: [] },
          recentActivities: activities ? JSON.parse(activities) : [],
        });
        setCachedPetId(petId);
      } catch (e) {
        // Fail silently
      }
    };
    void loadCache();
  }, [petId]);

  const now = new Date();
  const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const query = useQuery({
    queryKey: ['dashboard', petId, localDateStr.split('T')[0]],
    queryFn: async () => {
      console.log('[useDashboardQuery] Fetching dashboard from API...');
      return fetchUnifiedDashboard(token!, localDateStr);
    },
    enabled: Boolean(token && petId && petId !== 'fallback-pet-id-123' && !isSwitching),
    staleTime: 1000 * 60 * 5,
    // Poll every 15 seconds so family members receive live walk session state changes
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  // Save each segment back to AsyncStorage on successful query load
  useEffect(() => {
    if (query.data && petId) {
      console.log('[useDashboardQuery] Dashboard loaded successfully. Data keys:', Object.keys(query.data));
      const data = query.data;
      console.log('API Schedules:', data);
      void Promise.all([
        data.activePet ? AsyncStorage.setItem(`@pet_profile_cache_${petId}`, JSON.stringify(data.activePet)) : Promise.resolve(),
        data.todaySchedules ? AsyncStorage.setItem(`@today_schedule_cache_${petId}`, JSON.stringify(deduplicateSchedules(data.todaySchedules))) : Promise.resolve(),
        data.upcomingTasks ? AsyncStorage.setItem(`@upcoming_tasks_cache_${petId}`, JSON.stringify(data.upcomingTasks)) : Promise.resolve(),
        data.notifications ? AsyncStorage.setItem(`@notifications_cache_${petId}`, JSON.stringify(data.notifications)) : Promise.resolve(),
        data.recentActivities ? AsyncStorage.setItem(`@recent_activities_cache_${petId}`, JSON.stringify(data.recentActivities)) : Promise.resolve(),
        AsyncStorage.setItem(`@today_schedule_cache_timestamp_${petId}`, new Date().toDateString()),
      ]);

      // Cleanup pending notifications that no longer exist in database
      if (data.todaySchedules) {
        const activeIds: string[] = [];
        Object.values(data.todaySchedules).forEach((list: any) => {
          if (Array.isArray(list)) {
            list.forEach((item: any) => {
              if (item._id) activeIds.push(item._id);
              if (item.id && item.id !== item._id) activeIds.push(item.id);
            });
          }
        });
        void cleanupPendingNotifications(activeIds);
      }
    }
  }, [query.data, petId]);

  if (query.error) {
    console.error('[useDashboardQuery] Query error:', query.error);
  }

  const currentCachedData = cachedPetId === petId ? cachedData : undefined;
  const isLoading = (query.isLoading && !currentCachedData) || isSwitching;
  const isFetching = query.isFetching;
  const error = query.error;
  const rawData = query.data || currentCachedData;
  const data = useMemo(() => {
    if (!rawData) return undefined;
    return {
      ...rawData,
      todaySchedules: deduplicateSchedules(rawData.todaySchedules),
    };
  }, [rawData]);

  const refetch = useCallback(async () => {
    return query.refetch();
  }, [query.refetch]);

  // Optimistically REMOVE a schedule item from todaySchedules so it disappears
  // from the home screen instantly without waiting for a server refetch.
  const removeCacheScheduleItem = (
    prev: any,
    category: 'feeding' | 'walk' | 'medicine' | 'grooming' | 'vaccination',
    itemId: string,
  ): any => {
    if (!prev || !prev.todaySchedules) return prev;
    const todaySchedules = { ...prev.todaySchedules };
    if (todaySchedules[category]) {
      todaySchedules[category] = (todaySchedules[category] as any[]).filter(
        (item) => item._id !== itemId && item.id !== itemId
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
    mutationFn: async (scheduleId: string) => {
      const cached = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId, localDateStr]);
      const scheduleItem = cached?.todaySchedules?.feeding?.find((s: any) => s._id === scheduleId || s.id === scheduleId);
      const res = await completeFeedingSchedule(token!, scheduleId, {
        status: 'done',
        date: localDateStr,
        completedAt: new Date().toISOString(),
      });
      await cancelTaskNotifications(scheduleId, scheduleItem?.metadata);
      return res;
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId, localDateStr]);
      let itemTitle = 'Feeding';
      queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
        itemTitle = findItemTitle(prev, 'feeding', scheduleId, 'Feeding');
        let updated = removeCacheScheduleItem(prev, 'feeding', scheduleId);
        updated = removeCacheUpcomingTask(updated, scheduleId);
        return addCacheRecentActivity(updated, 'Feeding', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId, localDateStr], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline', petId] });
    },
  });

  // 2. Feeding Skip Mutation
  const skipFeedingMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const cached = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId, localDateStr]);
      const scheduleItem = cached?.todaySchedules?.feeding?.find((s: any) => s._id === scheduleId || s.id === scheduleId);
      const res = await skipFeedingSchedule(token!, scheduleId, {
        status: 'skipped',
        date: localDateStr,
        completedAt: new Date().toISOString(),
      });
      await cancelTaskNotifications(scheduleId, scheduleItem?.metadata);
      return res;
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId, localDateStr]);
      let itemTitle = 'Feeding';
      queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
        itemTitle = findItemTitle(prev, 'feeding', scheduleId, 'Feeding');
        let updated = removeCacheScheduleItem(prev, 'feeding', scheduleId);
        updated = removeCacheUpcomingTask(updated, scheduleId);
        return addCacheRecentActivity(updated, 'Feeding', `skipped ${itemTitle}`);
      });
      showToast(`${itemTitle} skipped successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId, localDateStr], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline', petId] });
    },
  });

  // 3. Walk Complete Mutation
  const completeWalkMutation = useMutation({
    mutationFn: async ({ scheduleId, elapsedMinutes }: { scheduleId: string; elapsedMinutes?: number }) => {
      const cached = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId, localDateStr]);
      const scheduleItem = cached?.todaySchedules?.walk?.find((s: any) => s._id === scheduleId || s.id === scheduleId);
      const res = await completeWalkSchedule(token!, scheduleId, {
        status: 'done',
        date: localDateStr,
        completedAt: new Date().toISOString(),
        ...(elapsedMinutes ? { duration: elapsedMinutes } : {}),
      });
      await cancelTaskNotifications(scheduleId, scheduleItem?.metadata);
      return res;
    },
    onMutate: async ({ scheduleId }) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId, localDateStr]);
      let itemTitle = 'Walk';
      queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
        itemTitle = findItemTitle(prev, 'walk', scheduleId, 'Walk');
        let updated = removeCacheScheduleItem(prev, 'walk', scheduleId);
        updated = removeCacheUpcomingTask(updated, scheduleId);
        return addCacheRecentActivity(updated, 'Walk', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, { scheduleId }, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId, localDateStr], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline', petId] });
    },
  });

  // 4. Medicine Complete Mutation
  const completeMedicineMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const cached = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId, localDateStr]);
      const scheduleItem = cached?.todaySchedules?.medicine?.find((s: any) => s._id === scheduleId || s.id === scheduleId);
      const res = await completeMedicineSchedule(token!, scheduleId, {
        status: 'done',
        date: localDateStr,
        completedAt: new Date().toISOString(),
      });
      await cancelTaskNotifications(scheduleId, scheduleItem?.metadata);
      return res;
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId, localDateStr]);
      let itemTitle = 'Medicine';
      queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
        itemTitle = findItemTitle(prev, 'medicine', scheduleId, 'Medicine');
        let updated = removeCacheScheduleItem(prev, 'medicine', scheduleId);
        updated = removeCacheUpcomingTask(updated, scheduleId);
        return addCacheRecentActivity(updated, 'Medicine', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId, localDateStr], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline', petId] });
    },
  });

  // 5. Grooming Complete Mutation
  const completeGroomingMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const cached = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId, localDateStr]);
      const scheduleItem = cached?.todaySchedules?.grooming?.find((s: any) => s._id === recordId || s.id === recordId);
      const res = await completeGroomingRecord(token!, recordId);
      await cancelTaskNotifications(recordId, (scheduleItem as any)?.metadata);
      return res;
    },
    onMutate: async (recordId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId, localDateStr]);
      let itemTitle = 'Grooming';
      queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
        itemTitle = findItemTitle(prev, 'grooming', recordId, 'Grooming');
        let updated = removeCacheScheduleItem(prev, 'grooming', recordId);
        updated = removeCacheUpcomingTask(updated, recordId);
        return addCacheRecentActivity(updated, 'Grooming', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, recordId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId, localDateStr], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline', petId] });
    },
  });

  // 6. Vaccination Complete Mutation
  const completeVaccinationMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const cached = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId, localDateStr]);
      const scheduleItem = cached?.todaySchedules?.vaccination?.find((s: any) => s._id === scheduleId || s.id === scheduleId);
      const res = await completeVaccinationSchedule(token!, scheduleId, {
        status: 'done',
        date: localDateStr,
        completedAt: new Date().toISOString(),
      });
      await cancelTaskNotifications(scheduleId, scheduleItem?.metadata);
      return res;
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId, localDateStr]);
      let itemTitle = 'Vaccination';
      queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
        itemTitle = findItemTitle(prev, 'vaccination', scheduleId, 'Vaccination');
        let updated = removeCacheScheduleItem(prev, 'vaccination', scheduleId);
        updated = removeCacheUpcomingTask(updated, scheduleId);
        return addCacheRecentActivity(updated, 'Vaccination', `completed ${itemTitle}`);
      });
      showToast(`${itemTitle} marked done successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId, localDateStr], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline', petId] });
    },
  });

  // 7. Walk Skip Mutation
  const skipWalkMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const cached = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId, localDateStr]);
      const scheduleItem = cached?.todaySchedules?.walk?.find((s: any) => s._id === scheduleId || s.id === scheduleId);
      const res = await completeWalkSchedule(token!, scheduleId, {
        status: 'skipped',
        date: localDateStr,
        completedAt: new Date().toISOString(),
      });
      await cancelTaskNotifications(scheduleId, scheduleItem?.metadata);
      return res;
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId, localDateStr]);
      let itemTitle = 'Walk';
      queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
        itemTitle = findItemTitle(prev, 'walk', scheduleId, 'Walk');
        let updated = removeCacheScheduleItem(prev, 'walk', scheduleId);
        updated = removeCacheUpcomingTask(updated, scheduleId);
        return addCacheRecentActivity(updated, 'Walk', `skipped ${itemTitle}`);
      });
      showToast(`${itemTitle} skipped successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId, localDateStr], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline', petId] });
    },
  });

  // 8. Medicine Skip Mutation
  const skipMedicineMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const cached = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId, localDateStr]);
      const scheduleItem = cached?.todaySchedules?.medicine?.find((s: any) => s._id === scheduleId || s.id === scheduleId);
      const res = await completeMedicineSchedule(token!, scheduleId, {
        status: 'skipped',
        date: localDateStr,
        completedAt: new Date().toISOString(),
      });
      await cancelTaskNotifications(scheduleId, scheduleItem?.metadata);
      return res;
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData(['dashboard', petId, localDateStr]);
      let itemTitle = 'Medicine';
      queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
        itemTitle = findItemTitle(prev, 'medicine', scheduleId, 'Medicine');
        let updated = removeCacheScheduleItem(prev, 'medicine', scheduleId);
        updated = removeCacheUpcomingTask(updated, scheduleId);
        return addCacheRecentActivity(updated, 'Medicine', `skipped ${itemTitle}`);
      });
      showToast(`${itemTitle} skipped successfully!`);
      return { previousDashboard };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', petId, localDateStr], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline', petId] });
    },
  });

  const startWalk = async (scheduleId: string) => {
    if (!token) return;
    // Optimistically write activeSession into the local cache so the current user's
    // own WalkTimer doesn't momentarily flash the "in progress" pill for themselves
    // while the PATCH is in-flight.
    queryClient.setQueryData(['dashboard', petId, localDateStr], (prev: any) => {
      if (!prev?.todaySchedules?.walk) return prev;
      return {
        ...prev,
        todaySchedules: {
          ...prev.todaySchedules,
          walk: (prev.todaySchedules.walk as any[]).map((item: any) =>
            (item._id === scheduleId || item.id === scheduleId)
              ? { ...item, metadata: { ...(item.metadata || {}), activeSession: { userId: '__self__', userName: 'You', startedAt: Date.now() } } }
              : item
          ),
        },
      };
    });
    // Fire-and-forget to backend — if it fails, next poll will clean up
    void startWalkSessionApi(token, scheduleId).catch(() => {});
  };

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    startWalk,
    completeFeeding: completeFeedingMutation.mutateAsync,
    skipFeeding: skipFeedingMutation.mutateAsync,
    completeWalk: (scheduleId: string, elapsedMinutes?: number) =>
      completeWalkMutation.mutateAsync({ scheduleId, elapsedMinutes }),
    skipWalk: skipWalkMutation.mutateAsync,
    completeMedicine: completeMedicineMutation.mutateAsync,
    skipMedicine: skipMedicineMutation.mutateAsync,
    completeGrooming: completeGroomingMutation.mutateAsync,
    completeVaccination: completeVaccinationMutation.mutateAsync,
  };
}
