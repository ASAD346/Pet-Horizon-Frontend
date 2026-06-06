import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchJournalEntries } from '@/services/journal/journalApi';
import type { ApiJournalEntry } from '@/types/journal';

export function useJournalEntries(
  token: string | null,
  petId: string | null,
  enabled: boolean,
) {
  const [entries, setEntries] = useState<ApiJournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const reload = useCallback(async () => {
    if (!token || !petId || !enabled) {
      setEntries([]);
      setError(null);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchJournalEntries(token, petId, 1, 100);
      setEntries(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setEntries([]);
      setError(getErrorMessage(err));
      log.fail('Journal', 'Load failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { entries, loading, error, total, reload };
}
