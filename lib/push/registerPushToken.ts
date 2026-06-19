import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import { registerDeviceToken } from '@/services/users/userApi';
import { log } from '@/lib/log';

const SCOPE = 'Push';

async function getNotificationsModule() {
  return import('expo-notifications');
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  const Notifications = await getNotificationsModule();
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Pet Horizon',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#5CB35D',
  });
}

async function requestPushPermission(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureNotificationHandler() {
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
}

/**
 * Obtain the native device push token (FCM on Android) and register it with the backend.
 * Requires a development or production build — not supported in Expo Go for FCM.
 */
export async function registerPushToken(authToken: string): Promise<string | null> {
  if (isExpoGo()) {
    log.info(SCOPE, 'Push skipped in Expo Go');
    return null;
  }

  if (Platform.OS === 'web') {
    log.info(SCOPE, 'Push skipped on web');
    return null;
  }

  if (!Device.isDevice) {
    log.info(SCOPE, 'Push skipped on simulator/emulator without device');
    return null;
  }

  await ensureNotificationHandler();

  const granted = await requestPushPermission();
  if (!granted) {
    log.warn(SCOPE, 'Notification permission denied');
    return null;
  }

  await ensureAndroidChannel();

  try {
    const Notifications = await getNotificationsModule();
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
