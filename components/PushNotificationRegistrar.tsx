import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import { ensureNotificationHandler } from '@/lib/push/notificationSetup';

/**
 * Prepares push infrastructure at launch and registers the FCM token after login.
 * Skipped in Expo Go (push + native modules require a dev build or APK).
 */
export function PushNotificationRegistrar() {
  const router = useRouter();
  const { token, isAuthenticated, isBootstrapping } = useAuth();
  const lastRegisteredAuthTokenRef = useRef<string | null>(null);
  const nativeTokenRef = useRef<string | null>(null);

  useEffect(() => {
    void ensureNotificationHandler();

    if (isExpoGo()) return;

    import('@/lib/push/registerPushToken')
      .then(({ ensureNativePushTokenRegistered }) => ensureNativePushTokenRegistered())
      .then((fcmToken) => {
        if (fcmToken) nativeTokenRef.current = fcmToken;
      })
      .catch(() => {
        // Errors are logged inside registerPushToken helpers.
      });
  }, []);

  useEffect(() => {
    if (isExpoGo() || isBootstrapping || !isAuthenticated || !token) return;
    if (lastRegisteredAuthTokenRef.current === token) return;

    import('@/lib/push/registerPushToken')
      .then(({ registerPushToken }) => registerPushToken(token))
      .then((fcmToken) => {
        if (fcmToken) {
          nativeTokenRef.current = fcmToken;
          lastRegisteredAuthTokenRef.current = token;
        }
      })
      .catch(() => {
        // Errors are logged inside registerPushToken.
      });
  }, [token, isAuthenticated, isBootstrapping]);

  useEffect(() => {
    if (isExpoGo() || isBootstrapping || !isAuthenticated || !token) return;

    const syncToken = () => {
      import('@/lib/push/registerPushToken')
        .then(({ registerPushToken }) => registerPushToken(token))
        .then((fcmToken) => {
          if (fcmToken) nativeTokenRef.current = fcmToken;
        })
        .catch(() => {});
    };

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') syncToken();
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [token, isAuthenticated, isBootstrapping]);

  useEffect(() => {
    let responseSubscription: { remove: () => void } | undefined;
    let receivedSubscription: { remove: () => void } | undefined;

    import('expo-notifications').then((Notifications) => {
      responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
        router.push('/notifications');
      });

      receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        logNotificationReceived(notification.request.content.title, notification.request.content.body);
      });
    });

    return () => {
      responseSubscription?.remove();
      receivedSubscription?.remove();
    };
  }, [router]);

  return null;
}

function logNotificationReceived(title?: string | null, body?: string | null) {
  if (__DEV__) {
    console.log('[Push] Notification received', { title, body });
  }
}
