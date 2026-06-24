import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usePetProfileQuery,
  useTodaySchedulesQuery,
  useUpcomingTasksQuery,
  useNotificationsQuery,
  useRecentActivitiesQuery,
} from './useDashboardSegments';
import type { UnifiedDashboardData } from '@/types/dashboard';
import { completeFeedingSchedule, skipFeedingSchedule } from '@/services/schedules/feedingApi';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { completeMedicineSchedule } from '@/services/schedules/medicineApi';
import { completeGroomingRecord } from '@/services/grooming/groomingApi';
import { completeVaccinationSchedule } from '@/services/schedules/vaccinationApi';

export function useDashboardQuery(token: string | null, petId: string | null | undefined) {
  const queryClient = useQueryClient();

  const profileQuery = usePetProfileQuery(token, petId);
  const schedulesQuery = useTodaySchedulesQuery(token, petId);
  const tasksQuery = useUpcomingTasksQuery(token, petId);
  const notificationsQuery = useNotificationsQuery(token, petId);
  const activitiesQuery = useRecentActivitiesQuery(token, petId);

  // Combine query status details
  const isLoading =
    profileQuery.isLoading ||
    schedulesQuery.isLoading ||
    tasksQuery.isLoading ||
    notificationsQuery.isLoading ||
    activitiesQuery.isLoading;

  const isFetching =
    profileQuery.isFetching ||
    schedulesQuery.isFetching ||
    tasksQuery.isFetching ||
    notificationsQuery.isFetching ||
    activitiesQuery.isFetching;

  const error =
    profileQuery.error ||
    schedulesQuery.error ||
    tasksQuery.error ||
    notificationsQuery.error ||
    activitiesQuery.error;

  const data = useMemo<UnifiedDashboardData | undefined>(() => {
    if (!profileQuery.data && !schedulesQuery.data) return undefined;
    return {
      activePet: (profileQuery.data ?? null) as any,
      todaySchedules: schedulesQuery.data || { feeding: [], walk: [], medicine: [], grooming: [], vaccination: [] },
      upcomingTasks: tasksQuery.data || [],
      notifications: notificationsQuery.data || { unreadCount: 0, list: [] },
      recentActivities: activitiesQuery.data || [],
    };
  }, [
    profileQuery.data,
    schedulesQuery.data,
    tasksQuery.data,
    notificationsQuery.data,
    activitiesQuery.data,
  ]);

  const refetch = async () => {
    await Promise.all([
      profileQuery.refetch(),
      schedulesQuery.refetch(),
      tasksQuery.refetch(),
      notificationsQuery.refetch(),
      activitiesQuery.refetch(),
    ]);
    return { data };
  };

  // Mutator helper for updating a schedule item status optimistically in the cached todaySchedules
  const updateCacheScheduleStatus = (
    prev: any,
    category: 'feeding' | 'walk' | 'medicine' | 'grooming' | 'vaccination',
    itemId: string,
    status: 'done' | 'skipped' | 'pending'
  ): any => {
    if (!prev) return prev;
    const todaySchedules = { ...prev };
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
    return todaySchedules;
  };

  // 1. Feeding Complete Mutation
  const completeFeedingMutation = useMutation({
    mutationFn: (scheduleId: string) => completeFeedingSchedule(token!, scheduleId, { status: 'done' }),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'schedules', petId] });
      const previousSchedules = queryClient.getQueryData(['dashboard', 'schedules', petId]);
      queryClient.setQueryData(['dashboard', 'schedules', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'feeding', scheduleId, 'done')
      );
      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(['dashboard', 'schedules', petId], context.previousSchedules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentActivities', petId] });
    },
  });

  // 2. Feeding Skip Mutation
  const skipFeedingMutation = useMutation({
    mutationFn: (scheduleId: string) => skipFeedingSchedule(token!, scheduleId),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'schedules', petId] });
      const previousSchedules = queryClient.getQueryData(['dashboard', 'schedules', petId]);
      queryClient.setQueryData(['dashboard', 'schedules', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'feeding', scheduleId, 'skipped')
      );
      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(['dashboard', 'schedules', petId], context.previousSchedules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentActivities', petId] });
    },
  });

  // 3. Walk Complete Mutation
  const completeWalkMutation = useMutation({
    mutationFn: (scheduleId: string) => completeWalkSchedule(token!, scheduleId, { status: 'done' }),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'schedules', petId] });
      const previousSchedules = queryClient.getQueryData(['dashboard', 'schedules', petId]);
      queryClient.setQueryData(['dashboard', 'schedules', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'walk', scheduleId, 'done')
      );
      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(['dashboard', 'schedules', petId], context.previousSchedules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentActivities', petId] });
    },
  });

  // 4. Medicine Complete Mutation
  const completeMedicineMutation = useMutation({
    mutationFn: (scheduleId: string) => completeMedicineSchedule(token!, scheduleId, { status: 'done' }),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'schedules', petId] });
      const previousSchedules = queryClient.getQueryData(['dashboard', 'schedules', petId]);
      queryClient.setQueryData(['dashboard', 'schedules', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'medicine', scheduleId, 'done')
      );
      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(['dashboard', 'schedules', petId], context.previousSchedules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentActivities', petId] });
    },
  });

  // 5. Grooming Complete Mutation
  const completeGroomingMutation = useMutation({
    mutationFn: (recordId: string) => completeGroomingRecord(token!, recordId),
    onMutate: async (recordId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'schedules', petId] });
      const previousSchedules = queryClient.getQueryData(['dashboard', 'schedules', petId]);
      queryClient.setQueryData(['dashboard', 'schedules', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'grooming', recordId, 'done')
      );
      return { previousSchedules };
    },
    onError: (err, recordId, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(['dashboard', 'schedules', petId], context.previousSchedules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentActivities', petId] });
    },
  });

  // 6. Vaccination Complete Mutation
  const completeVaccinationMutation = useMutation({
    mutationFn: (scheduleId: string) => completeVaccinationSchedule(token!, scheduleId),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'schedules', petId] });
      const previousSchedules = queryClient.getQueryData(['dashboard', 'schedules', petId]);
      queryClient.setQueryData(['dashboard', 'schedules', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'vaccination', scheduleId, 'done')
      );
      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(['dashboard', 'schedules', petId], context.previousSchedules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'schedules', petId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentActivities', petId] });
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
