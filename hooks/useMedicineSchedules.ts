import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
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
    focusReload: false,
  });

  const { showToast } = useToast();

  const completeMedicine = useCallback(
    async (scheduleId: string) => {
      if (!token) {
        log.warn('Medicine', 'Cannot complete — not signed in');
        return;
      }
      setActionId(scheduleId);
      // Optimistic: mark as done locally so it vanishes from Today's Schedule immediately
      setSchedules((prev) =>
        prev.map((s) => s._id === scheduleId ? { ...s, status: 'done' as const, completedAt: new Date().toISOString() } : s),
      );
      try {
        await completeMedicineSchedule(token, scheduleId, { status: 'done' });
        queryClient.invalidateQueries({ queryKey: ['dashboard', petId] });
        void reload(false);
        showToast('Medicine marked done successfully!');
      } catch (error) {
        // Revert optimistic update on failure
        setSchedules((prev) =>
          prev.map((s) => s._id === scheduleId ? { ...s, status: 'pending' as const, completedAt: undefined } : s),
        );
        log.fail('Medicine', 'Complete action failed', getErrorMessage(error));
        showToast(`Failed to complete: ${getErrorMessage(error)}`);
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
    completeMedicine,
  };
}
