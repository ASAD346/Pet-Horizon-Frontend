import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { HomeTheme } from '@/constants/theme';

/**
 * Restores the user to the right screen after a cold start when a session exists.
 */
export function useAuthEntryRedirect(enabled = true) {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  useEffect(() => {
    if (!enabled || isBootstrapping || !isAuthenticated) return;

    const target: Href = user?.activePetId ? '/(tabs)' : '/pet/register';
    router.replace(target);
  }, [enabled, isAuthenticated, isBootstrapping, router, user?.activePetId]);
}

export function AuthEntryLoader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={HomeTheme.cardGreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HomeTheme.background,
  },
});
