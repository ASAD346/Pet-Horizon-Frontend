import { Platform } from 'react-native';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import { log } from '@/lib/log';

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
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
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
    lightColor: '#5CB35D',
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
