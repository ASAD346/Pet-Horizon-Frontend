import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchPetMembers } from '@/services/family/familyApi';
import type { PetMemberRow } from '@/types/family';
import { useStaleFocusLoader } from './useStaleFocusLoader';

export function usePetMembers(token: string | null, petId: string | null, isOwner: boolean = true) {
  const [members, setMembers] = useState<PetMemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scopeKey = token && petId ? `${token}:${petId}` : null;

  const load = useCallback(async () => {
    if (!token || !petId || petId === 'fallback-pet-id-123') return [];
    return fetchPetMembers(token, petId);
  }, [token, petId]);

  const reload = useStaleFocusLoader({
    scopeKey,
    enabled: Boolean(token && petId),
    load,
    onSuccess: (rows) => {
      setMembers(rows);
      setError(null);
    },
    onClear: () => {
      setMembers([]);
      setError(null);
    },
    onError: (err, isFirstLoad) => {
      if (isFirstLoad) {
        setMembers([]);
        setError(getErrorMessage(err));
        log.fail('Family', 'Load members failed', getErrorMessage(err));
      }
    },
    setLoading,
  });

  return { members, setMembers, loading, error, reload };
}
