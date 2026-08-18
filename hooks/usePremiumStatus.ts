import { useQuery } from '@tanstack/react-query';
import { fetchPremiumStatus } from '@/services/premium/premiumApi';
import { useAuth } from './useAuth';

export function usePremiumStatus() {
  const { token, user } = useAuth();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?._id],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token found');
      return await fetchPremiumStatus(token);
    },
    enabled: Boolean(token && user?._id),
  });

  return {
    premiumStatus: data || null,
    isPremium: data?.isPremium ?? user?.premiumStatus === 'premium',
    isLoading,
    refetch,
  };
}
