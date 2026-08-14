import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { log } from '@/lib/log';
import { startWalkSession as startWalkSessionApi } from '@/services/schedules/walkApi';

export interface ActiveWalk {
  scheduleId: string;
  petId: string;
  startedAt: number;
  targetDuration: number;
  title?: string;
}

interface ActiveWalkContextType {
  activeWalk: ActiveWalk | null;
  startWalk: (scheduleId: string, petId: string, targetDuration: number, title?: string, token?: string) => Promise<void>;
  stopWalk: () => Promise<void>;
  loadActiveWalk: () => Promise<void>;
}

const ActiveWalkContext = createContext<ActiveWalkContextType | undefined>(undefined);

const STORAGE_KEY = 'active_walk_timer_data';

export function ActiveWalkProvider({ children }: { children: React.ReactNode }) {
  const [activeWalk, setActiveWalk] = useState<ActiveWalk | null>(null);

  const loadActiveWalk = useCallback(async () => {
    try {
      const dataStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (dataStr) {
        const parsed = JSON.parse(dataStr) as ActiveWalk;
        if (parsed && parsed.scheduleId && parsed.startedAt) {
          setActiveWalk(parsed);
        }
      }
    } catch (err) {
      log.warn('ActiveWalkContext', 'Failed to load active walk state', err as any);
    }
  }, []);

  useEffect(() => {
    loadActiveWalk();
  }, [loadActiveWalk]);

  const startWalk = useCallback(async (
    scheduleId: string,
    petId: string,
    targetDuration: number,
    title?: string,
    token?: string,
  ) => {
    const now = Date.now();
    const newWalk: ActiveWalk = {
      scheduleId,
      petId,
      startedAt: now,
      targetDuration,
      title: title || 'Walk',
    };
    setActiveWalk(newWalk);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newWalk));
      await AsyncStorage.setItem(`walk_timer_started_${scheduleId}`, String(now));
    } catch (err) {
      log.fail('ActiveWalkContext', 'Failed to save active walk state', err as any);
    }
    // Persist active session to backend (fire-and-forget — local timer always works)
    if (token) {
      void startWalkSessionApi(token, scheduleId).catch(() => {});
    }
  }, []);

  const stopWalk = useCallback(async () => {
    const current = activeWalk;
    setActiveWalk(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      if (current) {
        await AsyncStorage.removeItem(`walk_timer_started_${current.scheduleId}`);
        try {
          await Notifications.cancelScheduledNotificationAsync(`walk-done-${current.scheduleId}`);
        } catch (_) {}
      }
    } catch (err) {
      log.fail('ActiveWalkContext', 'Failed to stop walk state', err as any);
    }
  }, [activeWalk]);

  return (
    <ActiveWalkContext.Provider value={{ activeWalk, startWalk, stopWalk, loadActiveWalk }}>
      {children}
    </ActiveWalkContext.Provider>
  );
}

export function useActiveWalk() {
  const context = useContext(ActiveWalkContext);
  if (context === undefined) {
    throw new Error('useActiveWalk must be used within an ActiveWalkProvider');
  }
  return context;
}
