import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  completeGroomingRecord,
  fetchGroomingRecords,
  fetchGroomingTypes,
} from '@/services/grooming/groomingApi';
import type { GroomingRecord } from '@/types/grooming';
import { useStaleFocusLoader } from './useStaleFocusLoader';
import { useToast } from '@/hooks/useToast';

interface GroomingLoadResult {
  records: GroomingRecord[];
  groomingVisible: boolean;
}

export function useGroomingRecords(token: string | null, petId: string | null | undefined) {
  const [records, setRecords] = useState<GroomingRecord[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const scopeKey = token && petId ? `${token}:${petId}` : null;

  const load = useCallback(async (): Promise<GroomingLoadResult> => {
    if (!token || !petId) {
      return { records: [], groomingVisible: true };
    }

    const typesInfo = await fetchGroomingTypes(token, petId);
    if (!typesInfo.groomingVisible) {
      log.warn('Grooming', 'Module hidden for pet species', { species: typesInfo.species });
      return { records: [], groomingVisible: false };
    }

    const data = await fetchGroomingRecords(token, petId, 'upcoming');
    return { records: data, groomingVisible: typesInfo.groomingVisible };
  }, [token, petId]);

  const reload = useStaleFocusLoader({
    scopeKey,
    enabled: Boolean(token && petId),
    load,
    onSuccess: ({ records: rows, groomingVisible: visible }) => {
      setRecords(rows);
      setGroomingVisible(visible);
    },
    onClear: () => {
      setRecords([]);
      setGroomingVisible(true);
    },
    onError: (error, isFirstLoad) => {
      if (isFirstLoad) {
        setRecords([]);
        log.fail('Grooming', 'Home records load failed', getErrorMessage(error));
      }
    },
    setLoading,
  });

  const { showToast } = useToast();

  const completeGrooming = useCallback(
    async (recordId: string) => {
      if (!token) {
        log.warn('Grooming', 'Cannot complete — not signed in');
        return;
      }
      setActionId(recordId);
      // Optimistic: set performedAt locally so it vanishes from Today's Schedule immediately
      setRecords((prev) =>
        prev.map((r) => r._id === recordId ? { ...r, performedAt: new Date().toISOString() } : r),
      );
      try {
        await completeGroomingRecord(token, recordId);
        void reload(false);
        showToast('Grooming marked done successfully!');
      } catch (error) {
        // Revert optimistic update on failure
        setRecords((prev) =>
          prev.map((r) => r._id === recordId ? { ...r, performedAt: undefined } : r),
        );
        log.fail('Grooming', 'Complete action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload, showToast],
  );

  return {
    records,
    groomingVisible,
    loading,
    actionId,
    reload,
    completeGrooming,
  };
}
