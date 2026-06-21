import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStatusBar } from '@/components/ui/AppStatusBar';
import 'react-native-reanimated';

import { AuthBootstrap } from '@/components/auth/AuthBootstrap';
import { PushNotificationRegistrar } from '@/components/PushNotificationRegistrar';
import { ToastHost } from '@/components/ui/ToastHost';
import { ensureNotificationHandler } from '@/lib/push/notificationSetup';
import { store } from '@/redux/store';
import { useColorScheme } from '../hooks/use-color-scheme';

void ensureNotificationHandler();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AuthBootstrap />
        <ToastHost />
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <PushNotificationRegistrar />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
            <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="pet/register" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="invite/[token]" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
          </Stack>
          <AppStatusBar />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
