import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  completeFeedingSchedule,
  fetchFeedingSchedules,
  skipFeedingSchedule,
} from '@/services/schedules/feedingApi';
import type { FeedingScheduleItem } from '@/types/feeding';
import { useStaleFocusLoader } from './useStaleFocusLoader';
import { useToast } from '@/hooks/useToast';

export function useFeedingSchedules(token: string | null, petId: string | null | undefined) {
  const [schedules, setSchedules] = useState<FeedingScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const scopeKey = token && petId ? `${token}:${petId}` : null;

  const load = useCallback(async () => {
    if (!token || !petId) return [];
    return fetchFeedingSchedules(token, petId);
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
        log.fail('Feeding', 'Home schedules load failed', getErrorMessage(error));
      }
    },
    setLoading,
  });

  const { showToast } = useToast();

  const completeFeeding = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Feeding', 'Cannot complete — not signed in');
        return;
      }
      setActionId(scheduleId);
      try {
        await completeFeedingSchedule(token, scheduleId, { status: 'done' });
        await reload(true);
        showToast('Feeding marked done successfully!');
      } catch (error) {
        log.fail('Feeding', 'Complete action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload, showToast],
  );

  const skipFeeding = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Feeding', 'Cannot skip — not signed in');
        return;
      }
      setActionId(scheduleId);
      try {
        await skipFeedingSchedule(token, scheduleId);
        await reload(true);
        showToast('Feeding skipped successfully!');
      } catch (error) {
        log.fail('Feeding', 'Skip action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload, showToast],
  );

  return {
    schedules,
    loading,
    actionId,
    reload,
    completeFeeding,
    skipFeeding,
  };
}
