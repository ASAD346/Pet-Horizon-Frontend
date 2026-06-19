import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { isExpoGo } from '@/lib/runtime/isExpoGo';

/**
 * Registers the device FCM token after login and handles notification taps.
 * Skipped in Expo Go (push + native modules require a dev build or APK).
 */
export function PushNotificationRegistrar() {
  const router = useRouter();
  const { token, isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isExpoGo() || isBootstrapping || !isAuthenticated || !token) return;

    import('@/lib/push/registerPushToken')
      .then(({ registerPushToken }) => registerPushToken(token))
      .catch(() => {
        // Errors are logged inside registerPushToken.
      });
  }, [token, isAuthenticated, isBootstrapping]);

  useEffect(() => {
    if (isExpoGo()) return;

    let subscription: { remove: () => void } | undefined;

    import('expo-notifications').then((Notifications) => {
      subscription = Notifications.addNotificationResponseReceivedListener(() => {
        router.push('/notifications');
      });
    });

    return () => subscription?.remove();
  }, [router]);

  return null;
}
