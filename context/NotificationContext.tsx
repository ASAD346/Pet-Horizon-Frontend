import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fetchUnreadCount } from '@/services/notifications/notificationApi';
import { log } from '@/lib/log';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  syncWithServer: (token: string | null) => Promise<number>;
  clearBadge: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const ASYNC_KEY = 'unread_notification_count';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, _setUnreadCount] = useState<number>(0);

  // Load from storage initially
  useEffect(() => {
    async function loadStoredCount() {
      try {
        const stored = await AsyncStorage.getItem(ASYNC_KEY);
        if (stored !== null) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) {
            _setUnreadCount(parsed);
            if (Platform.OS !== 'web') {
              await Notifications.setBadgeCountAsync(parsed).catch(() => {});
            }
          }
        }
      } catch (err) {
        log.warn('NotificationStore', 'Failed to load stored count', err);
      }
    }
    loadStoredCount();
  }, []);

  const setUnreadCount = useCallback(async (count: number) => {
    const safeCount = Math.max(0, count);
    _setUnreadCount(safeCount);
    try {
      await AsyncStorage.setItem(ASYNC_KEY, String(safeCount));
      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(safeCount).catch(() => {});
      }
    } catch (err) {
      log.warn('NotificationStore', 'Failed to save count', err);
    }
  }, []);

  const incrementUnreadCount = useCallback(() => {
    _setUnreadCount((prev) => {
      const next = prev + 1;
      setUnreadCount(next);
      return next;
    });
  }, [setUnreadCount]);

  const decrementUnreadCount = useCallback(() => {
    _setUnreadCount((prev) => {
      const next = Math.max(0, prev - 1);
      setUnreadCount(next);
      return next;
    });
  }, [setUnreadCount]);

  const syncWithServer = useCallback(async (token: string | null): Promise<number> => {
    if (!token) return 0;
    try {
      const res = await fetchUnreadCount(token);
      const count = res.unreadCount;
      await setUnreadCount(count);
      return count;
    } catch (err) {
      log.fail('NotificationStore', 'Failed to sync unread count', err);
      return unreadCount;
    }
  }, [setUnreadCount, unreadCount]);

  const clearBadge = useCallback(async () => {
    await setUnreadCount(0);
  }, [setUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        incrementUnreadCount,
        decrementUnreadCount,
        syncWithServer,
        clearBadge,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationStore() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationStore must be used within a NotificationProvider');
  }
  return context;
}
