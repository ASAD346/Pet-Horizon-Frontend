import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import {
  computeNextDueDate,
  dateToApiDateString,
} from '@/lib/vaccination/vaccinationForm';
import { log } from '@/lib/log';
import {
  completeVaccinationSchedule,
  fetchVaccinationSchedules,
} from '@/services/schedules/vaccinationApi';
import type { VaccinationScheduleItem } from '@/types/vaccination';
import { useStaleFocusLoader } from './useStaleFocusLoader';
import { useToast } from '@/hooks/useToast';

export function useVaccinationSchedules(token: string | null, petId: string | null | undefined) {
  const [schedules, setSchedules] = useState<VaccinationScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const scopeKey = token && petId ? `${token}:${petId}` : null;

  const load = useCallback(async () => {
    if (!token || !petId) return [];
    return fetchVaccinationSchedules(token, petId);
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
        log.fail('Vaccination', 'Home schedules load failed', getErrorMessage(error));
      }
    },
    setLoading,
    focusReload: false,
  });

  const { showToast } = useToast();

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
      // Optimistic: set administeredDate locally so it vanishes from Today's Schedule immediately
      setSchedules((prev) =>
        prev.map((s) =>
          s._id === scheduleId
            ? { ...s, metadata: { ...s.metadata, administeredDate: administeredDate } }
            : s,
        ),
      );
      try {
        await completeVaccinationSchedule(token, scheduleId, body);
        void reload(false);
        showToast('Vaccination marked done successfully!');
      } catch (error) {
        // Revert optimistic update on failure
        setSchedules((prev) =>
          prev.map((s) =>
            s._id === scheduleId
              ? { ...s, metadata: { ...s.metadata, administeredDate: undefined } }
              : s,
          ),
        );
        log.fail('Vaccination', 'Complete action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload, schedules, showToast],
  );

  return {
    schedules,
    loading,
    actionId,
    reload,
    completeVaccination,
  };
}
