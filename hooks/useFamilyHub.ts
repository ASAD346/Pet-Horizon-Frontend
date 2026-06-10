import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { resolveFamilyIdFromPets } from '@/lib/family/formatters';
import { log } from '@/lib/log';
import {
  createFamily,
  deleteFamily,
  fetchFamilyMembers,
} from '@/services/family/familyHubApi';
import {
  clearStoredFamilyHubId,
  getStoredFamilyHubId,
  setStoredFamilyHubId,
} from '@/services/family/familyHubStorage';
import { fetchPets } from '@/services/pets/petApi';
import type { ApiFamily, FamilyHubMemberRow } from '@/types/family';
import type { ApiPet } from '@/types/pet';

export function useFamilyHub(
  token: string | null,
  userId: string | undefined,
  activePetId: string | null | undefined,
) {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyHubMemberRow[]>([]);
  const [familyPets, setFamilyPets] = useState<ApiPet[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !userId) {
      setFamilyId(null);
      setFamilyName(null);
      setMembers([]);
      setFamilyPets([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pets = await fetchPets(token);
      let resolvedId = resolveFamilyIdFromPets(pets, activePetId);

      if (!resolvedId) {
        const stored = await getStoredFamilyHubId(userId);
        if (stored) {
          try {
            await fetchFamilyMembers(token, stored);
            resolvedId = stored;
          } catch {
            await clearStoredFamilyHubId(userId);
          }
        }
      }

      if (!resolvedId) {
        setFamilyId(null);
        setFamilyName(null);
        setMembers([]);
        setFamilyPets([]);
        return;
      }

      setFamilyId(resolvedId);
      await setStoredFamilyHubId(userId, resolvedId);

      const rows = await fetchFamilyMembers(token, resolvedId);
      setMembers(rows);

      const inFamily = pets.filter((pet) => pet.familyId === resolvedId);
      setFamilyPets(inFamily);

      const hubName =
        inFamily[0]?.name != null
          ? `${inFamily.length > 1 ? 'Family' : `${inFamily[0].name}'s`} Hub`
          : rows.length > 0
            ? 'Family Hub'
            : null;
      setFamilyName(hubName);
    } catch (err) {
      setFamilyId(null);
      setMembers([]);
      setFamilyPets([]);
      setError(getErrorMessage(err));
      log.fail('FamilyHub', 'Load failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, userId, activePetId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const createFamilyHub = useCallback(
    async (name: string): Promise<ApiFamily | null> => {
      if (!token || !userId) return null;
      setCreating(true);
      setError(null);
      try {
        const family = await createFamily(token, { name: name.trim() });
        await setStoredFamilyHubId(userId, family._id);
        setFamilyId(family._id);
        setFamilyName(family.name);
        await reload();
        return family;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [token, userId, reload],
  );

  const removeFamilyHub = useCallback(async () => {
    if (!token || !userId || !familyId) return;
    await deleteFamily(token, familyId);
    await clearStoredFamilyHubId(userId);
    setFamilyId(null);
    setFamilyName(null);
    setMembers([]);
    setFamilyPets([]);
  }, [token, userId, familyId]);

  return {
    familyId,
    familyName,
    members,
    familyPets,
    loading,
    creating,
    error,
    reload,
    createFamilyHub,
    removeFamilyHub,
  };
}
