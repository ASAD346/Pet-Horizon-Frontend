import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { registerPushToken } from '@/lib/push/registerPushToken';

/**
 * Registers the device FCM token after login and handles notification taps.
 */
export function PushNotificationRegistrar() {
  const router = useRouter();
  const { token, isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated || !token) return;
    registerPushToken(token).catch(() => {
      // Errors are logged inside registerPushToken.
    });
  }, [token, isAuthenticated, isBootstrapping]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/notifications');
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}
