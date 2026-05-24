import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { fetchActivePetId, fetchPetById } from '@/services/pets/petApi';
import type { ApiPet } from '@/types/pet';

export function useActivePet(token: string | null) {
  const [pet, setPet] = useState<ApiPet | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!token) {
      setPet(null);
      return;
    }

    setLoading(true);
    try {
      const { activePetId } = await fetchActivePetId(token);
      if (!activePetId) {
        setPet(null);
        log.info('Home', 'No active pet');
        return;
      }
      const active = await fetchPetById(token, activePetId);
      setPet(active);
    } catch (error) {
      setPet(null);
      log.fail('Home', 'Load active pet failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { pet, loading, reload };
}
