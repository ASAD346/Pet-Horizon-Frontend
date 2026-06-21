import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchPets, setActivePet } from '@/services/pets/petApi';
import type { ApiPet } from '@/types/pet';
import { useStaleFocusLoader } from './useStaleFocusLoader';

export function usePets(token: string | null, activePetId?: string | null) {
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return [];
    return fetchPets(token);
  }, [token]);

  const reload = useStaleFocusLoader({
    scopeKey: token,
    enabled: Boolean(token),
    load,
    onSuccess: (rows) => {
      setPets(rows);
      setError(null);
    },
    onClear: () => {
      setPets([]);
      setError(null);
    },
    onError: (err, isFirstLoad) => {
      if (isFirstLoad) {
        setPets([]);
        setError(getErrorMessage(err));
        log.fail('Pets', 'List failed', getErrorMessage(err));
      }
    },
    setLoading,
  });

  const switchPet = useCallback(
    async (petId: string) => {
      if (!token || petId === activePetId) return;
      setSwitchingId(petId);
      try {
        await setActivePet(token, petId);
        await reload();
      } catch (err) {
        log.fail('Pets', 'Switch failed', getErrorMessage(err));
        throw err;
      } finally {
        setSwitchingId(null);
      }
    },
    [token, activePetId, reload],
  );

  return { pets, loading, error, switchingId, reload, switchPet };
}
