import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import { log } from '@/lib/log';
import { ensureAndroidNotificationChannels, ensureNotificationHandler } from '@/lib/push/notificationSetup';

const SCOPE = 'Permissions';
const COLD_START_KEY = '@permissions_cold_start_prompted_v1';

export interface PermissionStatusSummary {
  notifications: boolean;
  camera: boolean;
  photoLibrary: boolean;
}

/**
 * Checks current status of Notifications, Camera, and Photos without triggering OS prompts.
 */
export async function getAppPermissionsStatus(): Promise<PermissionStatusSummary> {
  let notifications = false;
  let camera = false;
  let photoLibrary = false;

  try {
    if (Platform.OS !== 'web' && !isExpoGo()) {
      const Notifications = await import('expo-notifications');
      const notifStatus = await Notifications.getPermissionsAsync();
      notifications = notifStatus.status === 'granted';
    }
  } catch (err) {
    log.warn(SCOPE, 'Error checking notification status', err instanceof Error ? err.message : String(err));
  }

  try {
    const camStatus = await ImagePicker.getCameraPermissionsAsync();
    camera = camStatus.granted;
  } catch (err) {
    log.warn(SCOPE, 'Error checking camera status', err instanceof Error ? err.message : String(err));
  }

  try {
    const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
    photoLibrary = mediaStatus.granted;
  } catch (err) {
    log.warn(SCOPE, 'Error checking media library status', err instanceof Error ? err.message : String(err));
  }

  return { notifications, camera, photoLibrary };
}

/**
 * Requests native cold-start permissions sequentially:
 * 1. Post Notifications
 * 2. Camera
 * 3. Photo Gallery / Media Library
 *
 * Runs non-intrusively in sequence and does not block app rendering.
 */
export async function requestColdStartPermissions(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const hasPrompted = await AsyncStorage.getItem(COLD_START_KEY);

    // 1. Post Notifications
    if (!isExpoGo()) {
      try {
        await ensureNotificationHandler();
        await ensureAndroidNotificationChannels();

        const Notifications = await import('expo-notifications');
        const notifPerm = await Notifications.getPermissionsAsync();

        if (notifPerm.status !== 'granted') {
          // If never prompted, or can ask again
          if (!hasPrompted || notifPerm.canAskAgain) {
            log.info(SCOPE, 'Requesting notification permission on cold start...');
            await Notifications.requestPermissionsAsync({
              ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
              },
            });
          }
        }
      } catch (e) {
        log.warn(SCOPE, 'Notification permission request error', e instanceof Error ? e.message : String(e));
      }
    }

    // 2. Camera
    try {
      const camPerm = await ImagePicker.getCameraPermissionsAsync();
      if (!camPerm.granted) {
        if (!hasPrompted || camPerm.canAskAgain) {
          log.info(SCOPE, 'Requesting camera permission on cold start...');
          await ImagePicker.requestCameraPermissionsAsync();
        }
      }
    } catch (e) {
      log.warn(SCOPE, 'Camera permission request error', e instanceof Error ? e.message : String(e));
    }

    // 3. Photo Library / Gallery
    try {
      const mediaPerm = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!mediaPerm.granted) {
        if (!hasPrompted || mediaPerm.canAskAgain) {
          log.info(SCOPE, 'Requesting media library permission on cold start...');
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
      }
    } catch (e) {
      log.warn(SCOPE, 'Media library permission request error', e instanceof Error ? e.message : String(e));
    }

    // Mark cold start as prompted
    if (!hasPrompted) {
      await AsyncStorage.setItem(COLD_START_KEY, 'true');
    }

    log.ok(SCOPE, 'Cold start native permissions flow completed');
  } catch (error) {
    log.fail(SCOPE, 'Error during cold start permissions flow', error instanceof Error ? error.message : String(error));
  }
}
