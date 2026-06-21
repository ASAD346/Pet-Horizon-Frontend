import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchUpcomingTasks } from '@/services/dashboard/dashboardApi';
import type { DashboardTask } from '@/types/dashboard';
import { useStaleFocusLoader } from './useStaleFocusLoader';

export function useUpcomingTasks(token: string | null) {
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return [];
    return fetchUpcomingTasks(token);
  }, [token]);

  const reload = useStaleFocusLoader({
    scopeKey: token,
    enabled: Boolean(token),
    load,
    onSuccess: (rows) => {
      setTasks(rows);
      setError(null);
    },
    onClear: () => {
      setTasks([]);
      setError(null);
    },
    onError: (err, isFirstLoad) => {
      if (isFirstLoad) {
        setTasks([]);
        setError(getErrorMessage(err));
        log.fail('Dashboard', 'Upcoming tasks failed', getErrorMessage(err));
      }
    },
    setLoading,
  });

  return { tasks, loading, error, reload };
}
