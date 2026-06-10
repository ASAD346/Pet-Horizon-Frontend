import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchLowStockAlert } from '@/services/inventory/inventoryApi';
import type { InventoryLowStockAlert } from '@/types/inventory';

export function useLowStockAlert(token: string | null, petId: string | null, enabled = true) {
  const [alert, setAlert] = useState<InventoryLowStockAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId || !enabled) {
      setAlert(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchLowStockAlert(token, petId);
      setAlert(data);
    } catch (err) {
      setAlert(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { alert, loading, error, reload };
}
