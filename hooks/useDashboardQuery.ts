import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUnifiedDashboard } from '@/services/dashboard/dashboardApi';
import type { UnifiedDashboardData } from '@/types/dashboard';
import { completeFeedingSchedule, skipFeedingSchedule } from '@/services/schedules/feedingApi';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { completeMedicineSchedule } from '@/services/schedules/medicineApi';
import { completeGroomingRecord } from '@/services/grooming/groomingApi';
import { completeVaccinationSchedule } from '@/services/schedules/vaccinationApi';

export function useDashboardQuery(token: string | null, petId: string | null | undefined) {
  const queryClient = useQueryClient();

  // Define unified query
  const query = useQuery<UnifiedDashboardData>({
    queryKey: ['dashboard', petId],
    queryFn: () => fetchUnifiedDashboard(token!),
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });

  // Mutator helper for updating a schedule item status optimistically in the cached todaySchedules
  const updateCacheScheduleStatus = (
    prev: UnifiedDashboardData | undefined,
    category: 'feeding' | 'walk' | 'medicine' | 'grooming' | 'vaccination',
    itemId: string,
    status: 'done' | 'skipped' | 'pending'
  ): UnifiedDashboardData | undefined => {
    if (!prev) return prev;
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
    return { ...prev, todaySchedules };
  };

  // 1. Feeding Complete Mutation
  const completeFeedingMutation = useMutation({
    mutationFn: (scheduleId: string) => completeFeedingSchedule(token!, scheduleId, { status: 'done' }),
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', petId] });
      const previousDashboard = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId]);
      queryClient.setQueryData<UnifiedDashboardData>(['dashboard', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'feeding', scheduleId, 'done')
      );
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
      const previousDashboard = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId]);
      queryClient.setQueryData<UnifiedDashboardData>(['dashboard', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'feeding', scheduleId, 'skipped')
      );
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
      const previousDashboard = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId]);
      queryClient.setQueryData<UnifiedDashboardData>(['dashboard', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'walk', scheduleId, 'done')
      );
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
      const previousDashboard = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId]);
      queryClient.setQueryData<UnifiedDashboardData>(['dashboard', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'medicine', scheduleId, 'done')
      );
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
      const previousDashboard = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId]);
      queryClient.setQueryData<UnifiedDashboardData>(['dashboard', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'grooming', recordId, 'done')
      );
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
      const previousDashboard = queryClient.getQueryData<UnifiedDashboardData>(['dashboard', petId]);
      queryClient.setQueryData<UnifiedDashboardData>(['dashboard', petId], (prev) =>
        updateCacheScheduleStatus(prev, 'vaccination', scheduleId, 'done')
      );
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
    ...query,
    completeFeeding: completeFeedingMutation.mutateAsync,
    skipFeeding: skipFeedingMutation.mutateAsync,
    completeWalk: completeWalkMutation.mutateAsync,
    completeMedicine: completeMedicineMutation.mutateAsync,
    completeGrooming: completeGroomingMutation.mutateAsync,
    completeVaccination: completeVaccinationMutation.mutateAsync,
  };
}
