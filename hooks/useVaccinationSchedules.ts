import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  computeNextDueDate,
  dateToApiDateString,
} from '@/lib/vaccination/vaccinationForm';
import {
  completeVaccinationSchedule,
  deleteVaccinationSchedule,
  fetchVaccinationSchedules,
  updateVaccinationSchedule,
} from '@/services/schedules/vaccinationApi';
import type { UpdateVaccinationScheduleRequest, VaccinationScheduleItem } from '@/types/vaccination';

export function useVaccinationSchedules(token: string | null, petId: string | null | undefined) {
  const [schedules, setSchedules] = useState<VaccinationScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setSchedules([]);
      if (!token) log.warn('Vaccination', 'Skipping load — not signed in');
      else if (!petId) log.warn('Vaccination', 'Skipping load — no active pet');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchVaccinationSchedules(token, petId);
      setSchedules(data);
    } catch (error) {
      setSchedules([]);
      log.fail('Vaccination', 'Home schedules load failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const completeVaccination = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Vaccination', 'Cannot complete — not signed in');
        return;
      }

      const schedule = schedules.find((item) => item._id === scheduleId);
      const administeredDate = dateToApiDateString(new Date());
      const body: { administeredDate: string; nextDueDate?: string } = { administeredDate };

      if (schedule?.metadata?.isRecurring && schedule.metadata.recurrenceInterval) {
        const baseDate = schedule.metadata.dueDate
          ? new Date(schedule.metadata.dueDate)
          : new Date();
        body.nextDueDate = dateToApiDateString(
          computeNextDueDate(baseDate, schedule.metadata.recurrenceInterval),
        );
      }

      setActionId(scheduleId);
      try {
        await completeVaccinationSchedule(token, scheduleId, body);
        await reload();
      } catch (error) {
        log.fail('Vaccination', 'Complete action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload, schedules],
  );

  const updateVaccination = useCallback(
    async (scheduleId: string, body: UpdateVaccinationScheduleRequest) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await updateVaccinationSchedule(token, scheduleId, body);
        await reload();
      } catch (error) {
        log.fail('Vaccination', 'Update failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const removeVaccination = useCallback(
    async (scheduleId: string) => {
      if (!token) return;
      setActionId(scheduleId);
      try {
        await deleteVaccinationSchedule(token, scheduleId);
        await reload();
      } catch (error) {
        log.fail('Vaccination', 'Delete failed', getErrorMessage(error));
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
    completeVaccination,
    updateVaccination,
    removeVaccination,
  };
}
