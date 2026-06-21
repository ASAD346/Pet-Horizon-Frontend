import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { completeWalkSchedule, fetchTodayWalkSchedules } from '@/services/schedules/walkApi';
import type { WalkScheduleItem } from '@/types/walk';
import { useStaleFocusLoader } from './useStaleFocusLoader';

export function useWalkSchedules(token: string | null, petId: string | null | undefined) {
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
  });

  const completeWalk = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Walk', 'Cannot complete — not signed in');
        return;
      }
      setActionId(scheduleId);
      try {
        await completeWalkSchedule(token, scheduleId, { status: 'done' });
        await reload();
      } catch (error) {
        log.fail('Walk', 'Complete action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  return {
    schedules,
    loading,
    actionId,
    reload,
    completeWalk,
  };
}
