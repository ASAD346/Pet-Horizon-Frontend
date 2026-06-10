import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import {
  createHealthMetric,
  deleteHealthMetric,
  fetchHealthMetrics,
  updateHealthMetric,
} from '@/services/health/healthApi';
import type { CreateHealthRequest, HealthMetric, UpdateHealthRequest } from '@/types/health';

export function useHealthMetrics(token: string | null, petId: string | null, enabled = true) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId || !enabled) {
      setMetrics([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealthMetrics(token, petId);
      setMetrics(data);
    } catch (err) {
      setMetrics([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (payload: CreateHealthRequest) => {
      if (!token) return;
      setActionId('create');
      try {
        await createHealthMetric(token, payload);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const update = useCallback(
    async (id: string, payload: UpdateHealthRequest) => {
      if (!token) return;
      setActionId(id);
      try {
        await updateHealthMetric(token, id, payload);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      setActionId(id);
      try {
        await deleteHealthMetric(token, id);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  return { metrics, loading, error, actionId, reload, create, update, remove };
}
