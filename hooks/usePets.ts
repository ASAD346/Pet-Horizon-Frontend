import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchPets, setActivePet } from '@/services/pets/petApi';
import type { ApiPet } from '@/types/pet';

export function usePets(token: string | null, activePetId?: string | null) {
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setPets([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchPets(token);
      setPets(rows);
    } catch (err) {
      setPets([]);
      setError(getErrorMessage(err));
      log.fail('Pets', 'List failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

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
