import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { completeWalkSchedule, fetchTodayWalkSchedules } from '@/services/schedules/walkApi';
import type { WalkScheduleItem } from '@/types/walk';
import { useStaleFocusLoader } from './useStaleFocusLoader';
import { useToast } from '@/hooks/useToast';

export function useWalkSchedules(token: string | null, petId: string | null | undefined) {
  const queryClient = useQueryClient();
  const [schedules, setSchedules] = useState<WalkScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const scopeKey = token && petId ? `${token}:${petId}` : null;

  const load = useCallback(async () => {
    if (!token || !petId) return [];
    return fetchTodayWalkSchedules(token, petId);
  }, [token, petId]);

  const reload = useStaleFocusLoader({
    scopeKey,
    enabled: Boolean(token && petId),
    load,
    onSuccess: setSchedules,
    onClear: () => setSchedules([]),
    onError: (error, isFirstLoad) => {
      if (isFirstLoad) {
        setSchedules([]);
        log.fail('Walk', 'Home schedules load failed', getErrorMessage(error));
      }
    },
    setLoading,
    focusReload: false,
  });

  const { showToast } = useToast();

  const completeWalk = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Walk', 'Cannot complete — not signed in');
        return;
      }
      setActionId(scheduleId);
      // Optimistic: mark as done locally so it vanishes from Today's Schedule immediately
      setSchedules((prev) =>
        prev.map((s) => s._id === scheduleId ? { ...s, status: 'done' as const, completedAt: new Date().toISOString() } : s),
      );
      try {
        await completeWalkSchedule(token, scheduleId, { status: 'done' });
        queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
        void reload(false);
        showToast('Walk marked done successfully!');
      } catch (error) {
        // Revert optimistic update on failure
        setSchedules((prev) =>
          prev.map((s) => s._id === scheduleId ? { ...s, status: 'pending' as const, completedAt: undefined } : s),
        );
        log.fail('Walk', 'Complete action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload, showToast, queryClient, petId],
  );

  return {
    schedules,
    loading,
    actionId,
    reload,
    completeWalk,
  };
}
