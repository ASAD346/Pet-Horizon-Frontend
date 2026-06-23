import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  completeMedicineSchedule,
  fetchTodayMedicineSchedules,
} from '@/services/schedules/medicineApi';
import type { MedicineScheduleItem } from '@/types/medicine';
import { useStaleFocusLoader } from './useStaleFocusLoader';
import { useToast } from '@/hooks/useToast';

export function useMedicineSchedules(token: string | null, petId: string | null | undefined) {
  const [schedules, setSchedules] = useState<MedicineScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const scopeKey = token && petId ? `${token}:${petId}` : null;

  const load = useCallback(async () => {
    if (!token || !petId) return [];
    return fetchTodayMedicineSchedules(token, petId);
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
        log.fail('Medicine', 'Home schedules load failed', getErrorMessage(error));
      }
    },
    setLoading,
  });

  const { showToast } = useToast();

  const completeMedicine = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Medicine', 'Cannot complete — not signed in');
        return;
      }
      setActionId(scheduleId);
      try {
        await completeMedicineSchedule(token, scheduleId, { status: 'done' });
        await reload(true);
        showToast('Medicine marked done successfully!');
      } catch (error) {
        log.fail('Medicine', 'Complete action failed', getErrorMessage(error));
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
    completeMedicine,
  };
}
