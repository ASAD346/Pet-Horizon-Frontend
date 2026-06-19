import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeTheme } from '@/constants/theme';

/** Ensures system status bar icons and background are visible on all screens. */
export function AppStatusBar() {
  return (
    <>
      {Platform.OS === 'android' ? (
        <RNStatusBar
          barStyle="dark-content"
          backgroundColor={HomeTheme.background}
          translucent={false}
        />
      ) : null}
      <StatusBar style="dark" backgroundColor={HomeTheme.background} />
    </>
  );
}
