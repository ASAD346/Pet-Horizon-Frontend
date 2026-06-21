import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import { registerDeviceToken } from '@/services/users/userApi';
import { log } from '@/lib/log';
import { acquireDevicePushToken } from '@/lib/push/notificationSetup';

const SCOPE = 'Push';

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

  const fcmToken = await acquireDevicePushToken();
  if (!fcmToken) {
    return null;
  }

  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await registerDeviceToken(authToken, fcmToken, platform);
    log.ok(SCOPE, 'Device token registered with backend', { platform });
    return fcmToken;
  } catch (error) {
    log.fail(SCOPE, 'Backend token registration failed', error instanceof Error ? error.message : String(error));
    // Keep the native token — Firebase Console campaigns can still reach this device.
    return fcmToken;
  }
}

/** Register FCM/APNs token with Firebase as soon as the app launches (no login required). */
export async function ensureNativePushTokenRegistered(): Promise<string | null> {
  if (isExpoGo() || Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  return acquireDevicePushToken();
}
