import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { dashboardToProfileStats } from '@/lib/dashboard/dashboardMappers';
import { log } from '@/lib/log';
import { fetchDashboardStatus } from '@/services/dashboard/dashboardApi';
import type { DashboardStatus } from '@/types/dashboard';

export function useDashboardStatus(token: string | null) {
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [profileStats, setProfileStats] = useState<ReturnType<typeof dashboardToProfileStats> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setStatus(null);
      setProfileStats(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStatus(token);
      setStatus(data);
      setProfileStats(dashboardToProfileStats(data));
    } catch (err) {
      setStatus(null);
      setProfileStats(null);
      setError(getErrorMessage(err));
      log.fail('Dashboard', 'Status failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { status, profileStats, loading, error, reload };
}
