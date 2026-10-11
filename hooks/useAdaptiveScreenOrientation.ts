import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Automatically locks orientation to portrait on mobile phones,
 * while allowing full orientation changes and resizability
 * on tablets, foldables, and large screen devices (Android 16+ compliant).
 */
export function useAdaptiveScreenOrientation() {
  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }

    let isMounted = true;

    async function applyOrientationPolicy() {
      try {
        const deviceType = await Device.getDeviceTypeAsync();

        if (!isMounted) return;

        if (deviceType === Device.DeviceType.PHONE) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
          // Tablets, foldables, and desktop/large screens: keep unlocked
          await ScreenOrientation.unlockAsync();
        }
      } catch (error) {
        console.warn('Failed to apply adaptive screen orientation:', error);
      }
    }

    void applyOrientationPolicy();

    return () => {
      isMounted = false;
    };
  }, []);
}
