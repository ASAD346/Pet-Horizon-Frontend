import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import {
  completeActivityEntry,
  createActivityEntry,
  deleteActivityEntry,
  fetchActivityTimeline,
  updateActivityEntry,
} from '@/services/activity/activityApi';
import type {
  ActivityTimelineResponse,
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@/types/activity';

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function useActivityTimeline(
  token: string | null,
  petId: string | null,
  enabled = true,
  date?: string,
) {
  const [timeline, setTimeline] = useState<ActivityTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const activeDate = date ?? todayIso();

  const reload = useCallback(async () => {
    if (!token || !petId || !enabled) {
      setTimeline(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityTimeline(token, petId, { date: activeDate });
      setTimeline(data);
    } catch (err) {
      setTimeline(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, enabled, activeDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (payload: CreateActivityRequest, imageUris?: string[]) => {
      if (!token || !petId) return;
      setActionId('create');
      try {
        await createActivityEntry(token, petId, payload, imageUris);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, petId, reload],
  );

  const update = useCallback(
    async (entryId: string, payload: UpdateActivityRequest, imageUris?: string[]) => {
      if (!token || !petId) return;
      setActionId(entryId);
      try {
        await updateActivityEntry(token, petId, entryId, payload, imageUris);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, petId, reload],
  );

  const complete = useCallback(
    async (entryId: string, completionNote?: string, imageUris?: string[]) => {
      if (!token || !petId) return;
      setActionId(entryId);
      try {
        await completeActivityEntry(token, petId, entryId, completionNote, imageUris);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, petId, reload],
  );

  const remove = useCallback(
    async (entryId: string) => {
      if (!token || !petId) return;
      setActionId(entryId);
      try {
        await deleteActivityEntry(token, petId, entryId);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, petId, reload],
  );

  return {
    timeline,
    entries: timeline?.entries ?? [],
    loading,
    error,
    actionId,
    reload,
    create,
    update,
    complete,
    remove,
  };
}
