import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

void ensureNotificationHandler();

// Prevent the native splash screen from automatically hiding
void SplashScreen.preventAutoHideAsync();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false, // In React Native, window focus behaviors differ, managed manually via focus hooks
      staleTime: 1000 * 60 * 5, // 5 minutes stale time
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthBootstrap />
          <ToastHost />
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <PushNotificationRegistrar />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
              <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="pet/register" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen name="invite/[token]" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="schedule-history" options={{ headerShown: false }} />
              <Stack.Screen name="activity-history" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
            </Stack>
            <AppStatusBar />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}
