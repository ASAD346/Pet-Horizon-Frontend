import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import { ensureNotificationHandler } from '@/lib/push/notificationSetup';
import { useAppDispatch } from '@/redux/store';
import { showToastAction } from '@/redux/action';
import { completeFeedingSchedule } from '@/services/schedules/feedingApi';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { completeMedicineSchedule } from '@/services/schedules/medicineApi';
import { completeVaccinationSchedule } from '@/services/schedules/vaccinationApi';

/**
 * Prepares push infrastructure at launch and registers the FCM token after login.
 * Skipped in Expo Go (push + native modules require a dev build or APK).
 */
export function PushNotificationRegistrar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
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
      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const { actionIdentifier, notification } = response;
        const data = notification.request.content.data;
        const scheduleId = String(data?.relatedScheduleItemId || data?.id || '');
        const type = data?.type;

        if (actionIdentifier === 'mark-done' && scheduleId && token) {
          (async () => {
            try {
              if (type === 'feeding') {
                await completeFeedingSchedule(token, scheduleId, { status: 'done' });
              } else if (type === 'walk') {
                await completeWalkSchedule(token, scheduleId, { status: 'done' });
              } else if (type === 'medicine') {
                await completeMedicineSchedule(token, scheduleId, { status: 'done' });
              } else if (type === 'vaccination') {
                await completeVaccinationSchedule(token, scheduleId);
              }
              dispatch(showToastAction('Activity marked as done! 🐾', 'success'));
            } catch (err) {
              console.error('Failed to mark done via notification action:', err);
              dispatch(showToastAction('Failed to complete activity', 'error'));
            }
          })();
        } else if (actionIdentifier === 'snooze') {
          (async () => {
            try {
              const bodyText = notification.request.content.body || '';
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: notification.request.content.title,
                  body: bodyText.includes('(Snoozed ⏰)')
                    ? bodyText
                    : `${bodyText} (Snoozed ⏰)`,
                  data: notification.request.content.data,
                  sound: true,
                  categoryIdentifier: 'care-alert',
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                  seconds: 300,
                },
              });
              dispatch(showToastAction('Reminder snoozed for 5 minutes ⏰', 'success'));
            } catch (err) {
              console.error('Failed to snooze notification:', err);
            }
          })();
        } else {
          router.push('/notifications');
        }
      });

      receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        const title = notification.request.content.title || '';
        const body = notification.request.content.body || '';

        // Clean redundant strings
        const cleanTitle = title
          .replace(/Feed Feeding/gi, 'Feeding')
          .replace(/Walk Walking/gi, 'Walking')
          .replace(/Walk Walk/gi, 'Walk')
          .replace(/feed feeding/gi, 'feeding')
          .replace(/walk walking/gi, 'walking')
          .replace(/walk walk/gi, 'walk');
        const cleanBody = body
          .replace(/Feed Feeding/gi, 'Feeding')
          .replace(/Walk Walking/gi, 'Walking')
          .replace(/Walk Walk/gi, 'Walk')
          .replace(/feed feeding/gi, 'feeding')
          .replace(/walk walking/gi, 'walking')
          .replace(/walk walk/gi, 'walk');

        logNotificationReceived(cleanTitle, cleanBody);
        
        // Show our themed toast
        dispatch(showToastAction(cleanBody || cleanTitle, 'success'));
      });
    });

    return () => {
      responseSubscription?.remove();
      receivedSubscription?.remove();
    };
  }, [router, dispatch]);

  return null;
}

function logNotificationReceived(title?: string | null, body?: string | null) {
  if (__DEV__) {
    console.log('[Push] Notification received', { title, body });
  }
}
