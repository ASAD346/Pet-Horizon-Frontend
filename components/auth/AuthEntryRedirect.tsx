import { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

/**
 * Restores the user to the right screen after a cold start when a session exists.
 */
export function useAuthEntryRedirect(enabled = true) {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  useEffect(() => {
    if (!enabled || isBootstrapping || !isAuthenticated) return;

    const target: Href = user?.activePetId ? '/(tabs)' : '/pet/register';
    const timer = setTimeout(() => {
      router.replace(target);
    }, 10);
    return () => clearTimeout(timer);
  }, [enabled, isAuthenticated, isBootstrapping, router, user?.activePetId]);
}
