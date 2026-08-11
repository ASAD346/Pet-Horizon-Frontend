import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAppSelector } from '@/redux/store';
import { selectActivePetId } from '@/redux/reducer';

interface WalkTimerProps {
  scheduleId: string;
  isDone: boolean;
  isSkipped: boolean;
  isPremium: boolean;
  targetDuration?: number; // target walk duration in minutes
  onComplete: (id: string, elapsedMinutes?: number) => void | Promise<void>;
  onSkip: (id: string) => void | Promise<void>;
}

export function WalkTimer({
  scheduleId,
  isDone,
  isSkipped,
  isPremium,
  targetDuration = 45,
  onComplete,
  onSkip,
}: WalkTimerProps) {
  const { activeWalk, startWalk, stopWalk } = useActiveWalk();
  const activePetId = useAppSelector(selectActivePetId);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync startedAt with activeWalk from context
  useEffect(() => {
    if (activeWalk && activeWalk.scheduleId === scheduleId) {
      setStartedAt(activeWalk.startedAt);
      setElapsedSeconds(Math.floor((Date.now() - activeWalk.startedAt) / 1000));
    } else {
      setStartedAt(null);
    }
  }, [activeWalk, scheduleId]);

  // Load running timer state from AsyncStorage fallback
  useEffect(() => {
    const loadWalkState = async () => {
      try {
        if (activeWalk && activeWalk.scheduleId === scheduleId) return;
        const storedStr = await AsyncStorage.getItem(`walk_timer_started_${scheduleId}`);
        if (storedStr) {
          const timestamp = parseInt(storedStr, 10);
          if (!isNaN(timestamp)) {
            setStartedAt(timestamp);
            setElapsedSeconds(Math.floor((Date.now() - timestamp) / 1000));
          }
        }
      } catch (_) {}
    };
    loadWalkState();
  }, [scheduleId]);

  // Keep counter ticking & schedule notifications
  useEffect(() => {
    if (startedAt !== null) {
      // 1. Setup tick interval for UI clock ONLY
      timerRef.current = setInterval(() => {
        const curElapsed = Math.floor((Date.now() - startedAt) / 1000);
        setElapsedSeconds(curElapsed);
      }, 1000);

      // 2. Schedule local OS notification exactly once on start/mount for absolute future timestamp
      const scheduleWalkCompleteNotification = async () => {
        const targetSeconds = targetDuration * 60;
        const remainingSeconds = targetSeconds - Math.floor((Date.now() - startedAt) / 1000);

        if (remainingSeconds <= 0) return;

        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') return;

          // Cancel any previous walk notification for this schedule
          try {
            await Notifications.cancelScheduledNotificationAsync(`walk-done-${scheduleId}`);
          } catch (_) {}

          await Notifications.scheduleNotificationAsync({
            identifier: `walk-done-${scheduleId}`,
            content: {
              title: 'Pet Horizon 🐾',
              body: 'Your walk time is complete!',
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: remainingSeconds,
            },
          });
        } catch (_) {}
      };

      scheduleWalkCompleteNotification();

    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startedAt, targetDuration, scheduleId]);

  const handleStart = async () => {
    try {
      await startWalk(scheduleId, activePetId || '', targetDuration, 'Walk');
    } catch (_) {}
  };

  const cleanUpNotificationAndStorage = async () => {
    try {
      await Notifications.cancelScheduledNotificationAsync(`walk-done-${scheduleId}`);
    } catch (_) {}
    try {
      await AsyncStorage.removeItem(`walk_timer_started_${scheduleId}`);
    } catch (_) {}
  };

  const handleComplete = async () => {
    if (busy) return;
    setBusy(true);

    const finalSeconds = elapsedSeconds;

    // Instantly cancel pre-scheduled native notification and storage
    await cleanUpNotificationAndStorage();

    // Stop walk in global context
    await stopWalk();

    // Instantly reset timer state
    setStartedAt(null);
    setElapsedSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const minutes = Math.max(1, Math.round(finalSeconds / 60));
      await onComplete(scheduleId, minutes);
    } catch (_) {
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onSkip(scheduleId);
      await cleanUpNotificationAndStorage();
    } catch (_) {
    } finally {
      setBusy(false);
    }
  };

  if (isDone) {
    return (
      <View style={styles.checks}>
        <Ionicons name="checkmark" size={16} color={HomeTheme.cardGreen} />
        <Ionicons name="checkmark" size={16} color={HomeTheme.cardGreen} style={styles.checkOverlap} />
      </View>
    );
  }

  if (isSkipped) {
    return (
      <AppText variant="caption" weight="600" color={HomeTheme.textMuted}>
        Skipped
      </AppText>
    );
  }

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const buttonBg = isPremium ? '#D4A017' : '#3A8F3B';

  if (startedAt === null) {
    return (
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.skipBtn} activeOpacity={0.85} disabled={busy} onPress={handleSkip}>
          {busy ? <ActivityIndicator size="small" color="#7A869A" /> : <AppText variant="caption" weight="800" color="#7A869A">Skip</AppText>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: '#2563EB', borderColor: '#2563EB' }]} activeOpacity={0.85} onPress={handleStart}>
          <AppText variant="caption" weight="800" color="#FFFFFF">Start</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Show a pulsing Done prompt if walk timer has expired but user hasn't tapped Done yet
  const timerExpired = elapsedSeconds >= targetDuration * 60;

  return (
    <View style={styles.actionRow}>
      <View style={styles.timerWrapper}>
        <View style={[styles.pulseDot, timerExpired && { backgroundColor: '#16A34A' }]} />
        <AppText
          variant="caption"
          weight="800"
          color={timerExpired ? '#16A34A' : '#2563EB'}
          style={styles.timerText}
        >
          {formatTime(elapsedSeconds)}
        </AppText>
      </View>
      <TouchableOpacity style={[styles.doneBtn, { backgroundColor: buttonBg, borderColor: buttonBg }]} activeOpacity={0.85} disabled={busy} onPress={handleComplete}>
        {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <AppText variant="caption" weight="800" color="#FFFFFF">Done</AppText>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(122, 134, 154, 0.05)',
    borderColor: 'rgba(122, 134, 154, 0.15)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  checks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkOverlap: {
    marginLeft: -8,
  },
  timerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  timerText: {
    fontVariant: ['tabular-nums'],
  },
});
