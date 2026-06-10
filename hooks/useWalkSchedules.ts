import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  completeWalkSchedule,
  deleteWalkSchedule,
  fetchTodayWalkSchedules,
  rescheduleWalkSchedule,
  updateWalkSchedule,
} from '@/services/schedules/walkApi';
import type { RescheduleWalkRequest, UpdateWalkScheduleRequest } from '@/types/walk';
import type { WalkScheduleItem } from '@/types/walk';

export function useWalkSchedules(token: string | null, petId: string | null | undefined) {
  const [schedules, setSchedules] = useState<WalkScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setSchedules([]);
      if (!token) log.warn('Walk', 'Skipping load — not signed in');
      else if (!petId) log.warn('Walk', 'Skipping load — no active pet');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchTodayWalkSchedules(token, petId);
      setSchedules(data);
    } catch (error) {
      setSchedules([]);
      log.fail('Walk', 'Home schedules load failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

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

  const rescheduleWalk = useCallback(
    async (scheduleId: string, body: RescheduleWalkRequest) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await rescheduleWalkSchedule(token, scheduleId, body);
        await reload();
      } catch (error) {
        log.fail('Walk', 'Reschedule failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const updateWalk = useCallback(
    async (scheduleId: string, body: UpdateWalkScheduleRequest) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await updateWalkSchedule(token, scheduleId, body);
        await reload();
      } catch (error) {
        log.fail('Walk', 'Update failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const removeWalk = useCallback(
    async (scheduleId: string) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await deleteWalkSchedule(token, scheduleId);
        await reload();
      } catch (error) {
        log.fail('Walk', 'Delete failed', getErrorMessage(error));
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
    rescheduleWalk,
    updateWalk,
    removeWalk,
  };
}
