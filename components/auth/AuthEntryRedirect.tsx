import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { HomeTheme } from '@/constants/theme';
import { SkeletonScreenLayout } from '@/components/ui/skeletons';

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
    }, 0);
    return () => clearTimeout(timer);
  }, [enabled, isAuthenticated, isBootstrapping, router, user?.activePetId]);
}

export function AuthEntryLoader() {
  return (
    <View style={styles.loader}>
      <SkeletonScreenLayout />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: HomeTheme.background,
  },
});
