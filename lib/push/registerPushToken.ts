import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerDeviceToken } from '@/services/users/userApi';
import { log } from '@/lib/log';

const SCOPE = 'Push';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Pet Horizon',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#5CB35D',
  });
}

async function requestPushPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Obtain the native device push token (FCM on Android) and register it with the backend.
 * Requires a development or production build — not supported in Expo Go for FCM.
 */
export async function registerPushToken(authToken: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    log.info(SCOPE, 'Push skipped on web');
    return null;
  }

  if (!Device.isDevice) {
    log.info(SCOPE, 'Push skipped on simulator/emulator without device');
    return null;
  }

  const granted = await requestPushPermission();
  if (!granted) {
    log.warn(SCOPE, 'Notification permission denied');
    return null;
  }

  await ensureAndroidChannel();

  try {
    const pushToken = await Notifications.getDevicePushTokenAsync();
    const fcmToken = pushToken.data;

    if (!fcmToken) {
      log.warn(SCOPE, 'No push token returned');
      return null;
    }

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await registerDeviceToken(authToken, fcmToken, platform);
    log.ok(SCOPE, 'Device token registered', { platform });
    return fcmToken;
  } catch (error) {
    log.fail(SCOPE, 'Push registration failed', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export function getEasProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}
