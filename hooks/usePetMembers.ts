import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchPetMembers } from '@/services/family/familyApi';
import type { PetMemberRow } from '@/types/family';

export function usePetMembers(token: string | null, petId: string | null, isOwner: boolean) {
  const [members, setMembers] = useState<PetMemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId || !isOwner) {
      setMembers([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchPetMembers(token, petId);
      setMembers(rows);
    } catch (err) {
      setMembers([]);
      setError(getErrorMessage(err));
      log.fail('Family', 'Load members failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, isOwner]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { members, loading, error, reload };
}
