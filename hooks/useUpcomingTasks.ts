import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchUpcomingTasks } from '@/services/dashboard/dashboardApi';
import type { DashboardTask } from '@/types/dashboard';

export function useUpcomingTasks(token: string | null) {
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setTasks([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchUpcomingTasks(token);
      setTasks(rows);
    } catch (err) {
      setTasks([]);
      setError(getErrorMessage(err));
      log.fail('Dashboard', 'Upcoming tasks failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { tasks, loading, error, reload };
}
