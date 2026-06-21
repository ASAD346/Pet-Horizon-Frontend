import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchJournalEntries } from '@/services/journal/journalApi';
import type { ApiJournalEntry } from '@/types/journal';
import { useStaleLoadScope } from './useStaleLoadScope';

export function useJournalEntries(
  token: string | null,
  petId: string | null,
  enabled: boolean,
) {
  const [entries, setEntries] = useState<ApiJournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const scopeKey = enabled && token && petId ? `${token}:${petId}` : null;
  const { shouldBlockUI, markLoaded, reset } = useStaleLoadScope(scopeKey);

  const reload = useCallback(async () => {
    if (!token || !petId || !enabled) {
      reset();
      setEntries([]);
      setError(null);
      setTotal(0);
      setLoading(false);
      return;
    }

    const block = shouldBlockUI();
    if (block) setLoading(true);

    try {
      const data = await fetchJournalEntries(token, petId, 1, 100);
      setEntries(data.items ?? []);
      setTotal(data.total ?? 0);
      setError(null);
      markLoaded();
    } catch (err) {
      if (block) {
        setEntries([]);
        setTotal(0);
      }
      setError(getErrorMessage(err));
      log.fail('Journal', 'Load failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, enabled, markLoaded, reset, shouldBlockUI]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { entries, loading, error, total, reload };
}
