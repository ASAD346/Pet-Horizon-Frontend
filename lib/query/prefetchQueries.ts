import { QueryClient } from '@tanstack/react-query';
import { fetchUnifiedDashboard } from '@/services/dashboard/dashboardApi';
import { Image } from 'expo-image';
import { resolveMediaUrl } from '@/lib/mediaUrl';

/** Prefetches unified dashboard queries and preloads images to make transitions feel instant */
export async function prefetchDashboardData(
  queryClient: QueryClient,
  token: string | null,
  petId: string | null | undefined,
  imageUrl?: string | null
) {
  if (!token || !petId) return;

  // 1. Prefetch the dashboard query
  try {
    await queryClient.prefetchQuery({
      queryKey: ['dashboard', petId],
      queryFn: () => fetchUnifiedDashboard(token),
      staleTime: 1000 * 60 * 5, // 5 minutes stale time
    });
  } catch (err) {
    // Fail silently in background
  }

  // 2. Preload the pet avatar image if available
  if (imageUrl) {
    const resolvedUrl = resolveMediaUrl(imageUrl);
    if (resolvedUrl) {
      Image.prefetch(resolvedUrl);
    }
  }
}
