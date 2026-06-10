import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { log } from '@/lib/log';
import { registerDeviceToken } from '@/services/users/userApi';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function obtainPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) {
    log.warn('Push', 'Push tokens require a physical device');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    log.warn('Push', 'Notification permission not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResponse.data;
  } catch (error) {
    log.fail('Push', 'Failed to get push token', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function syncPushTokenWithBackend(authToken: string): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  const pushToken = await obtainPushToken();
  if (!pushToken) return;

  await registerDeviceToken(authToken, pushToken, Platform.OS);
  log.ok('Push', 'Device token synced with backend');
}
