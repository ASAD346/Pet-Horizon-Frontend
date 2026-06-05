import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
    completeGroomingRecord,
    fetchGroomingRecords,
    fetchGroomingTypes,
} from '@/services/grooming/groomingApi';
import type { GroomingRecord } from '@/types/grooming';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function useGroomingRecords(token: string | null, petId: string | null | undefined) {
  const [records, setRecords] = useState<GroomingRecord[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setRecords([]);
      setGroomingVisible(true);
      if (!token) log.warn('Grooming', 'Skipping load — not signed in');
      else if (!petId) log.warn('Grooming', 'Skipping load — no active pet');
      return;
    }

    setLoading(true);
    try {
      const typesInfo = await fetchGroomingTypes(token, petId);
      setGroomingVisible(typesInfo.groomingVisible);
      if (!typesInfo.groomingVisible) {
        setRecords([]);
        log.warn('Grooming', 'Module hidden for pet species', { species: typesInfo.species });
        return;
      }
      const data = await fetchGroomingRecords(token, petId, 'upcoming');
      setRecords(data);
    } catch (error) {
      setRecords([]);
      log.fail('Grooming', 'Home records load failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const completeGrooming = useCallback(
    async (recordId: string) => {
      if (!token) {
        log.warn('Grooming', 'Cannot complete — not signed in');
        return;
      }
      setActionId(recordId);
      try {
        await completeGroomingRecord(token, recordId);
        await reload();
      } catch (error) {
        log.fail('Grooming', 'Complete action failed', getErrorMessage(error));
        throw error;
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
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
