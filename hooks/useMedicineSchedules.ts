import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  completeMedicineSchedule,
  fetchTodayMedicineSchedules,
} from '@/services/schedules/medicineApi';
import type { MedicineScheduleItem } from '@/types/medicine';

export function useMedicineSchedules(token: string | null, petId: string | null | undefined) {
  const [schedules, setSchedules] = useState<MedicineScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setSchedules([]);
      if (!token) log.warn('Medicine', 'Skipping load — not signed in');
      else if (!petId) log.warn('Medicine', 'Skipping load — no active pet');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchTodayMedicineSchedules(token, petId);
      setSchedules(data);
    } catch (error) {
      setSchedules([]);
      log.fail('Medicine', 'Home schedules load failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const completeMedicine = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Medicine', 'Cannot complete — not signed in');
        return;
      }
      setActionId(scheduleId);
      try {
        await completeMedicineSchedule(token, scheduleId, { status: 'done' });
        await reload();
      } catch (error) {
        log.fail('Medicine', 'Complete action failed', getErrorMessage(error));
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
    completeMedicine,
  };
}
