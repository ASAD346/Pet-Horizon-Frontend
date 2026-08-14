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
import { ensureNotificationHandler, registerBackgroundFetchAsync } from '@/lib/push/notificationSetup';
import { store } from '@/redux/store';
import { useColorScheme } from '../hooks/use-color-scheme';
import { AppState, Platform } from 'react-native';
import React, { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { NotificationProvider, useNotificationStore } from '@/context/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { ActiveWalkProvider } from '@/context/ActiveWalkContext';
import { ActiveWalkOverlay } from '@/components/home/ActiveWalkOverlay';

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

import { runNotificationSystemAudit } from '@/lib/push/notificationTest';

function InnerLayout() {
  const colorScheme = useColorScheme();
  const { token, isBootstrapping } = useAuth();
  const { syncWithServer } = useNotificationStore();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const NB = NavigationBar as any;
      if (typeof NB.setBackgroundColorAsync === 'function') {
        void NB.setBackgroundColorAsync('#FFFDF0').catch(() => {});
      }
      if (typeof NB.setButtonStyleAsync === 'function') {
        void NB.setButtonStyleAsync('dark').catch(() => {});
      } else if (typeof NB.setStyle === 'function') {
        try {
          NB.setStyle('dark');
        } catch (e) {
          console.warn('NavigationBar.setStyle failed', e);
        }
      }
    }
    runNotificationSystemAudit().catch(() => {});
  }, []);

  useEffect(() => {
    // Initial sync
    if (token) {
      syncWithServer(token).catch(() => {});
      registerBackgroundFetchAsync().catch(() => {});
    }
  }, [token, syncWithServer]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && token) {
        syncWithServer(token).catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [token, syncWithServer]);

  return (
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
      <ActiveWalkOverlay />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NotificationProvider>
            <ActiveWalkProvider>
              <AuthBootstrap />
              <ToastHost />
              <InnerLayout />
            </ActiveWalkProvider>
          </NotificationProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}
