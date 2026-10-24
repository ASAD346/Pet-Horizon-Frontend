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
 * Requests Notification permission contextually (just-in-time).
 * If permission was previously denied and force is true, opens device settings.
 */
export async function requestNotificationPermission(force = false): Promise<boolean> {
  if (Platform.OS === 'web' || isExpoGo()) return false;

  try {
    const { requestPushPermission } = await import('@/lib/push/notificationSetup');
    return await requestPushPermission(force);
  } catch (err) {
    log.warn(SCOPE, 'Error requesting notification permission', err instanceof Error ? err.message : String(err));
    return false;
  }
}

/**
 * Requests Camera permission contextually when the user activates a feature that requires it.
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    return perm.granted;
  } catch (err) {
    log.warn(SCOPE, 'Error requesting camera permission', err instanceof Error ? err.message : String(err));
    return false;
  }
}

/**
 * Requests Photo Library permission contextually.
 */
export async function requestPhotoLibraryPermission(): Promise<boolean> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return perm.granted;
  } catch (err) {
    log.warn(SCOPE, 'Error requesting photo library permission', err instanceof Error ? err.message : String(err));
    return false;
  }
}

/**
 * @deprecated Cold start permission prompting has been removed. Permissions are now requested just-in-time.
 */
export async function requestColdStartPermissions(): Promise<void> {
  // Intentionally a no-op to prevent OS permission dialogs on launch.
}
