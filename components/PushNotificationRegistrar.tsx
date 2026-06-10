import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { syncPushTokenWithBackend } from '@/lib/push/registerPushToken';

/** Registers the device push token when the user is signed in. */
export function PushNotificationRegistrar() {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    syncPushTokenWithBackend(token).catch(() => {
      // Permission denied or Expo Go limitations — non-fatal
    });
  }, [isAuthenticated, token]);

  return null;
}
