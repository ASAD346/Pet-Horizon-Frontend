import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  completeMedicineSchedule,
  deleteMedicineSchedule,
  fetchMedicineHistory,
  fetchMedicineLowStock,
  fetchTodayMedicineSchedules,
  refillMedicineSchedule,
  updateMedicineSchedule,
} from '@/services/schedules/medicineApi';
import type {
  MedicineScheduleItem,
  RefillMedicineRequest,
  UpdateMedicineScheduleRequest,
} from '@/types/medicine';

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

  const updateMedicine = useCallback(
    async (scheduleId: string, body: UpdateMedicineScheduleRequest) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await updateMedicineSchedule(token, scheduleId, body);
        await reload();
      } catch (error) {
        log.fail('Medicine', 'Update failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const removeMedicine = useCallback(
    async (scheduleId: string) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await deleteMedicineSchedule(token, scheduleId);
        await reload();
      } catch (error) {
        log.fail('Medicine', 'Delete failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const refillMedicine = useCallback(
    async (scheduleId: string, body: RefillMedicineRequest) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await refillMedicineSchedule(token, scheduleId, body);
        await reload();
      } catch (error) {
        log.fail('Medicine', 'Refill failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const loadLowStock = useCallback(async () => {
    if (!token) return [];
    try {
      return await fetchMedicineLowStock(token);
    } catch {
      return [];
    }
  }, [token]);

  const loadHistory = useCallback(
    async (scheduleId: string) => {
      if (!token) return [];
      return fetchMedicineHistory(token, scheduleId);
    },
    [token],
  );

  return {
    schedules,
    loading,
    actionId,
    reload,
    completeMedicine,
    updateMedicine,
    removeMedicine,
    refillMedicine,
    loadLowStock,
    loadHistory,
  };
}
