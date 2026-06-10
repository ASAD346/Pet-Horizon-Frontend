import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import {
  createMedicalRecord,
  deleteMedicalRecord,
  fetchMedicalRecords,
  updateMedicalRecord,
} from '@/services/medical/medicalApi';
import type { CreateMedicalRequest, MedicalRecord, UpdateMedicalRequest } from '@/types/medical';

export function useMedicalRecords(token: string | null, petId: string | null, enabled = true) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId || !enabled) {
      setRecords([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchMedicalRecords(token, petId);
      setRecords(data);
    } catch (err) {
      setRecords([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (payload: CreateMedicalRequest) => {
      if (!token) return;
      setActionId('create');
      try {
        await createMedicalRecord(token, payload);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const update = useCallback(
    async (id: string, payload: UpdateMedicalRequest) => {
      if (!token) return;
      setActionId(id);
      try {
        await updateMedicalRecord(token, id, payload);
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
        await deleteMedicalRecord(token, id);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const upcoming = records
    .filter((r) => r.nextDueDate)
    .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime())[0];

  return { records, upcoming, loading, error, actionId, reload, create, update, remove };
}
