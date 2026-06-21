import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { dashboardToProfileStats } from '@/lib/dashboard/dashboardMappers';
import { log } from '@/lib/log';
import { fetchDashboardStatus } from '@/services/dashboard/dashboardApi';
import type { DashboardStatus } from '@/types/dashboard';
import { useStaleFocusLoader } from './useStaleFocusLoader';

export function useDashboardStatus(token: string | null) {
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [profileStats, setProfileStats] = useState<ReturnType<typeof dashboardToProfileStats> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) throw new Error('Not signed in');
    return fetchDashboardStatus(token);
  }, [token]);

  const reload = useStaleFocusLoader({
    scopeKey: token,
    enabled: Boolean(token),
    load,
    onSuccess: (data) => {
      setStatus(data);
      setProfileStats(dashboardToProfileStats(data));
      setError(null);
    },
    onClear: () => {
      setStatus(null);
      setProfileStats(null);
      setError(null);
    },
    onError: (err, isFirstLoad) => {
      if (isFirstLoad) {
        setStatus(null);
        setProfileStats(null);
        setError(getErrorMessage(err));
        log.fail('Dashboard', 'Status failed', getErrorMessage(err));
      }
    },
    setLoading,
  });

  return { status, profileStats, loading, error, reload };
}
