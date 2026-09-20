import { QueryClient } from '@tanstack/react-query';
import { fetchUnifiedDashboard } from '@/services/dashboard/dashboardApi';
import { loadExistingSchedules } from '@/lib/schedule/loadSchedules';
import { Image } from 'expo-image';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { ApiPet } from '@/types/pet';

/** Prefetches unified dashboard queries and preloads images to make transitions feel instant */
export async function prefetchDashboardData(
  queryClient: QueryClient,
  token: string | null,
  petId: string | null | undefined,
  imageUrl?: string | null
) {
  if (!token || !petId) return;

  try {
    await queryClient.prefetchQuery({
      queryKey: ['dashboard', petId],
      queryFn: () => fetchUnifiedDashboard(token),
      staleTime: 1000 * 60 * 5, // 5 minutes stale time
    });
  } catch (err) {
    // Fail silently in background
  }

  if (imageUrl) {
    const resolvedUrl = resolveMediaUrl(imageUrl);
    if (resolvedUrl) {
      Image.prefetch(resolvedUrl);
    }
  }
}

/** Prefetches all tab data (Dashboard, Schedules, etc.) for a pet */
export async function prefetchAllPetTabData(
  queryClient: QueryClient,
  token: string | null,
  pet: ApiPet | null | undefined
) {
  if (!token || !pet?._id) return;
  const petId = pet._id;

  // 1. Dashboard prefetch & image preload
  void prefetchDashboardData(queryClient, token, petId, pet.image);

  // 2. Schedule prefetch
  try {
    void queryClient.prefetchQuery({
      queryKey: ['schedules', petId],
      queryFn: () =>
        loadExistingSchedules(token, petId, {
          groomingVisible: true,
          disabledCategories: pet.disabledCategories ?? [],
        }),
      staleTime: 1000 * 60 * 2,
    });
  } catch {
    // Ignore prefetch failure
  }
}
