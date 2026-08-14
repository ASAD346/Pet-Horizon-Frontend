import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api/client';

interface SubscriptionContextType {
  isPremium: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { token, user, setSession } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['subscriptionStatus', user?._id],
    queryFn: async () => {
      if (!token) return { premiumStatus: 'free' };
      return apiRequest<{ premiumStatus: string }>('/premium/status', { token });
    },
    enabled: Boolean(token && user?._id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isPremium = useMemo(() => {
    if (query.data?.premiumStatus === 'premium') return true;
    return user?.premiumStatus === 'premium';
  }, [query.data, user]);

  // Sync premiumStatus changes to the Redux session / storage context if they mismatch
  useEffect(() => {
    if (query.data && user && query.data.premiumStatus !== user.premiumStatus && token) {
      void setSession({
        user: { ...user, premiumStatus: query.data.premiumStatus as 'free' | 'premium' | undefined },
        token,
      });
    }
  }, [query.data, user, token, setSession]);

  const refreshSubscription = async () => {
    await query.refetch();
  };

  const value = useMemo(() => ({
    isPremium,
    loading: query.isLoading,
    refreshSubscription,
  }), [isPremium, query.isLoading]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
