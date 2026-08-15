import { Platform } from 'react-native';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import { log } from '@/lib/log';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorageStatic from '@react-native-async-storage/async-storage';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';
export const FCM_FALLBACK_CHANNEL_ID = 'fcm_fallback_notification_channel';

const SCOPE = 'Push';

let handlerConfigured = false;
let channelsConfigured = false;

async function getNotificationsModule() {
  return import('expo-notifications');
}

export async function ensureNotificationHandler(): Promise<void> {
  if (handlerConfigured) return;

  const Notifications = await getNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data;
      const scheduleId = data?.relatedScheduleItemId || data?.id;
      const petId = data?.petId;

      if (scheduleId && petId) {
        try {
          const token = await AsyncStorageStatic.getItem('auth_token');
          if (token) {
            const url = `${API_BASE_URL}/schedules/today?petId=${petId}`;
            const response = await fetch(url, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            });
            if (response.ok) {
              const schedules = await response.json();
              let isMuted = false;

              if (Array.isArray(schedules)) {
                const sched = schedules.find((s: any) => String(s._id || s.id) === String(scheduleId)) as any;
                if (!sched || sched.status === 'done' || sched.status === 'skipped' || sched.isComplete === true) {
                  isMuted = true;
                }
              } else if (schedules && typeof schedules === 'object') {
                const allScheds = Object.values(schedules).flat();
                const sched = allScheds.find((s: any) => String(s._id || s.id) === String(scheduleId)) as any;
                if (!sched || sched.status === 'done' || sched.status === 'skipped' || sched.isComplete === true) {
                  isMuted = true;
                }
              }

              if (isMuted) {
                log.info(SCOPE, `Suppressing notification for completed/skipped/deleted schedule: ${scheduleId}`);
                return {
                  shouldShowAlert: false,
                  shouldPlaySound: false,
                  shouldSetBadge: false,
                  shouldShowBanner: false,
                  shouldShowList: false,
                };
              }
            }
          }
        } catch (err) {
          log.warn(SCOPE, 'SmartGuard check failed, displaying fallback', err instanceof Error ? err.message : String(err));
        }
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  if (Platform.OS !== 'web') {
    Notifications.setNotificationCategoryAsync('care-alert', []).catch(() => {});
  }
  handlerConfigured = true;
}

async function createAndroidChannel(
  channelId: string,
  name: string,
): Promise<void> {
  const Notifications = await getNotificationsModule();
  await Notifications.setNotificationChannelAsync(channelId, {
    name,
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1B4D3E',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

/** Android 13+ requires channels before the permission prompt or FCM token request. */
export async function ensureAndroidNotificationChannels(): Promise<void> {
  if (channelsConfigured || Platform.OS !== 'android' || isExpoGo()) return;

  await createAndroidChannel(DEFAULT_NOTIFICATION_CHANNEL_ID, 'Pet Horizon');
  await createAndroidChannel(FCM_FALLBACK_CHANNEL_ID, 'Pet Horizon alerts');
  channelsConfigured = true;
}

export async function requestPushPermission(): Promise<boolean> {
  if (isExpoGo()) return false;

  const Notifications = await getNotificationsModule();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status === 'granted';
}

/** Prepare handler, channels, and permission in the order Android expects. */
export async function preparePushNotifications(): Promise<boolean> {
  if (isExpoGo() || Platform.OS === 'web') return false;

  await ensureNotificationHandler();
  await ensureAndroidNotificationChannels();
  return requestPushPermission();
}

/**
 * Request the native FCM/APNs token so Firebase can target this device.
 * Must run after channels + permission on Android 13+.
 */
export async function acquireDevicePushToken(): Promise<string | null> {
  if (isExpoGo() || Platform.OS === 'web') {
    log.info(SCOPE, 'Token acquisition skipped in Expo Go / web');
    return null;
  }

  const granted = await preparePushNotifications();
  if (!granted) {
    log.warn(SCOPE, 'Notification permission denied — enable notifications in phone settings');
    return null;
  }

  try {
    const Notifications = await getNotificationsModule();
    
    // Safety timeout: Native token retrieval might hang if FCM credentials are misconfigured
    const tokenResult = await Promise.race([
      Notifications.getDevicePushTokenAsync(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('FCM token request timed out after 5s')), 5000))
    ]);

    const token = tokenResult?.data?.trim() ?? '';

    if (!token) {
      log.warn(SCOPE, 'No native push token returned');
      return null;
    }

    log.ok(SCOPE, 'Native push token acquired', {
      platform: Platform.OS,
      tokenPreview: `${token.slice(0, 12)}…`,
    });
    return token;
  } catch (error) {
    log.fail(SCOPE, 'Native push token failed', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Background Fetch & Task Manager
// ─────────────────────────────────────────────────────────────
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

export const BACKGROUND_FETCH_TASK = 'BACKGROUND-NOTIFICATION-FETCH';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = new Date();
  log.info('BackgroundFetch', `Background fetch run at ${now.toISOString()}`);
  try {
    // Sync notifications from server or update local badge count
    const token = await AsyncStorageStatic.getItem('auth_token');
    if (token) {
      // Trigger background scheduler run on backend
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api';
      await fetch(`${baseUrl}/notifications/tick`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});

      const response = await fetch(`${baseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        const unreadCount = items.filter((item: any) => !item.isRead).length;
        await AsyncStorageStatic.setItem('unread_notification_count', String(unreadCount));
        
        // Update local app icon badge via expo-notifications
        const Notifications = await getNotificationsModule();
        await Notifications.setBadgeCountAsync(unreadCount);
        
        log.ok('BackgroundFetch', 'Background badge count updated', { unreadCount });
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    log.fail('BackgroundFetch', 'Background fetch execution failed', err instanceof Error ? err.message : String(err));
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync(): Promise<void> {
  if (isExpoGo() || Platform.OS === 'web') return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      log.ok('BackgroundFetch', 'Background Fetch task registered successfully');
    }
  } catch (err) {
    log.fail('BackgroundFetch', 'Failed to register background fetch task', err instanceof Error ? err.message : String(err));
  }
}

export async function cancelTaskNotifications(scheduleId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await getNotificationsModule();
    // 1. Try to cancel/dismiss directly using standard naming schemes
    await Promise.allSettled([
      Notifications.cancelScheduledNotificationAsync(scheduleId),
      Notifications.cancelScheduledNotificationAsync(`walk-done-${scheduleId}`),
      Notifications.cancelScheduledNotificationAsync(`feeding-${scheduleId}`),
      Notifications.cancelScheduledNotificationAsync(`medicine-${scheduleId}`),
      Notifications.cancelScheduledNotificationAsync(`vaccination-${scheduleId}`),

      Notifications.dismissNotificationAsync(scheduleId),
      Notifications.dismissNotificationAsync(`walk-done-${scheduleId}`),
      Notifications.dismissNotificationAsync(`feeding-${scheduleId}`),
      Notifications.dismissNotificationAsync(`medicine-${scheduleId}`),
      Notifications.dismissNotificationAsync(`vaccination-${scheduleId}`),
    ]);

    // 2. Query all scheduled notifications to find any identifier that contains the scheduleId
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier === scheduleId || n.identifier.includes(scheduleId)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
        await Notifications.dismissNotificationAsync(n.identifier).catch(() => {});
      }
    }
    log.ok(SCOPE, 'Cancelled and dismissed notifications for task', { scheduleId });
  } catch (error) {
    log.fail(SCOPE, `Failed to cancel/dismiss notifications for schedule ${scheduleId}`, error instanceof Error ? error.message : String(error));
  }
}

export async function cleanupPendingNotifications(activeScheduleIds: string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await getNotificationsModule();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const activeSet = new Set(activeScheduleIds);
    let cancelledCount = 0;

    for (const n of scheduled) {
      const identifier = n.identifier;
      // Extract scheduleId
      let scheduleId = identifier;
      if (identifier.startsWith('walk-done-')) {
        scheduleId = identifier.replace('walk-done-', '');
      } else if (identifier.startsWith('feeding-')) {
        scheduleId = identifier.replace('feeding-', '');
      } else if (identifier.startsWith('medicine-')) {
        scheduleId = identifier.replace('medicine-', '');
      } else if (identifier.startsWith('vaccination-')) {
        scheduleId = identifier.replace('vaccination-', '');
      }

      if (!activeSet.has(scheduleId)) {
        await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
        cancelledCount++;
      }
    }

    if (cancelledCount > 0) {
      log.ok(SCOPE, 'Cleaned up ghost notifications', { count: cancelledCount });
    }
  } catch (error) {
    log.fail(SCOPE, 'Failed to cleanup pending notifications', error instanceof Error ? error.message : String(error));
  }
}

