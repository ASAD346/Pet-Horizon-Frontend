import { useQuery } from '@tanstack/react-query';
import { fetchPetHealthCard, type PetHealthCardResponse } from '@/services/pets/healthCardApi';

export function usePetHealthCard(
  token: string | null,
  petId: string | null | undefined,
  category: string = 'all'
) {
  const isEnabled = Boolean(token && petId && petId !== 'fallback-pet-id-123');

  const query = useQuery<PetHealthCardResponse, Error>({
    queryKey: ['petHealthCard', petId, category],
    queryFn: () => {
      if (!token || !petId) {
        throw new Error('Missing token or pet ID');
      }
      return fetchPetHealthCard(token, petId, category);
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 2, // 2 minutes fresh
    gcTime: 1000 * 60 * 10,   // 10 minutes cache retention
  });

  return {
    data: query.data,
    loading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}
