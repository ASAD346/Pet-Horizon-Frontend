import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  completeFeedingSchedule,
  deleteFeedingSchedule,
  fetchFeedingSchedules,
  skipFeedingSchedule,
  updateFeedingSchedule,
} from '@/services/schedules/feedingApi';
import type { FeedingScheduleItem, UpdateFeedingScheduleRequest } from '@/types/feeding';

export function useFeedingSchedules(token: string | null, petId: string | null | undefined) {
  const [schedules, setSchedules] = useState<FeedingScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setSchedules([]);
      if (!token) log.warn('Feeding', 'Skipping load — not signed in');
      else if (!petId) log.warn('Feeding', 'Skipping load — no active pet');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchFeedingSchedules(token, petId);
      setSchedules(data);
    } catch (error) {
      setSchedules([]);
      log.fail('Feeding', 'Home schedules load failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const completeFeeding = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Feeding', 'Cannot complete — not signed in');
        return;
      }
      setActionId(scheduleId);
      try {
        await completeFeedingSchedule(token, scheduleId, { status: 'done' });
        await reload();
      } catch (error) {
        log.fail('Feeding', 'Complete action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
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
        await reload();
      } catch (error) {
        log.fail('Feeding', 'Skip action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const updateFeeding = useCallback(
    async (scheduleId: string, body: UpdateFeedingScheduleRequest) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await updateFeedingSchedule(token, scheduleId, body);
        await reload();
      } catch (error) {
        log.fail('Feeding', 'Update failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const removeFeeding = useCallback(
    async (scheduleId: string) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await deleteFeedingSchedule(token, scheduleId);
        await reload();
      } catch (error) {
        log.fail('Feeding', 'Delete failed', getErrorMessage(error));
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
    completeFeeding,
    skipFeeding,
    updateFeeding,
    removeFeeding,
  };
}
