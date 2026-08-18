import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Animated, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAppSelector } from '@/redux/store';
import { selectActivePetId } from '@/redux/reducer';

interface ActiveWalkSession {
  userId: string;
  userName: string;
  startedAt: number;
}

interface WalkTimerProps {
  scheduleId: string;
  isDone: boolean;
  isSkipped: boolean;
  isPremium: boolean;
  targetDuration?: number;
  onComplete: (id: string, elapsedMinutes?: number) => void | Promise<void>;
  onSkip: (id: string) => void | Promise<void>;
  /** Active session from the server (set by whoever started the walk) */
  activeSession?: ActiveWalkSession | null;
  /** Current logged-in user's id to determine if we are the walker */
  currentUserId?: string;
  /** Token to pass to backend when starting the walk */
  token?: string;
}

export function WalkTimer({
  scheduleId,
  isDone,
  isSkipped,
  isPremium,
  targetDuration = 45,
  onComplete,
  onSkip,
  activeSession,
  currentUserId,
  token,
}: WalkTimerProps) {
  const { activeWalk, startWalk, stopWalk } = useActiveWalk();
  const activePetId = useAppSelector(selectActivePetId);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulsing animation for the "in-progress by other" pill
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.55, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

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
      timerRef.current = setInterval(() => {
        const curElapsed = Math.floor((Date.now() - startedAt) / 1000);
        setElapsedSeconds(curElapsed);
      }, 1000);

      const scheduleWalkCompleteNotification = async () => {
        const targetSeconds = targetDuration * 60;
        const remainingSeconds = targetSeconds - Math.floor((Date.now() - startedAt) / 1000);
        if (remainingSeconds <= 0) return;
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') return;
          try { await Notifications.cancelScheduledNotificationAsync(`walk-done-${scheduleId}`); } catch (_) {}
          await Notifications.scheduleNotificationAsync({
            identifier: `walk-done-${scheduleId}`,
            content: {
              title: '🐾 Pet Horizon · Care Alert',
              body: '🦮 Walk time is complete! Tap to open the app and log your activity.',
              sound: true,
              categoryIdentifier: 'care-alert',
              data: { id: scheduleId, type: 'walk', screen: '/explore' },
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startedAt, targetDuration, scheduleId]);

  const handleStart = async () => {
    try {
      await startWalk(scheduleId, activePetId || '', targetDuration, 'Walk', token);
    } catch (_) {}
  };

  const cleanUpNotificationAndStorage = async () => {
    try { await Notifications.cancelScheduledNotificationAsync(`walk-done-${scheduleId}`); } catch (_) {}
    try { await AsyncStorage.removeItem(`walk_timer_started_${scheduleId}`); } catch (_) {}
  };

  const handleComplete = async () => {
    if (busy) return;
    setBusy(true);
    const finalSeconds = elapsedSeconds;
    await cleanUpNotificationAndStorage();
    await stopWalk();
    setStartedAt(null);
    setElapsedSeconds(0);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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

  // ── "Walk in progress by another family member" pill ────────────────────────
  // Show when: there's a backend session, it doesn't belong to this user,
  // and the local timer for THIS card hasn't started on this device.
  const sessionByOther =
    activeSession &&
    activeSession.userId &&
    activeSession.userId !== '__self__' &&
    activeSession.userId !== currentUserId &&
    startedAt === null;

  if (sessionByOther) {
    const displayName = activeSession!.userName || 'A family member';
    return (
      <View style={styles.inProgressPill}>
        <Animated.View style={[styles.inProgressDot, { opacity: pulseAnim }]} />
        <AppText variant="caption" weight="700" color="#1D4ED8" numberOfLines={1} style={styles.inProgressText}>
          {displayName} is walking
        </AppText>
      </View>
    );
  }

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (startedAt === null) {
    return (
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [
            styles.skipBtn,
            pressed && styles.pressedBtn
          ]}
          disabled={busy}
          onPress={handleSkip}
        >
          {busy ? <ActivityIndicator size="small" color="#4B5563" /> : <AppText variant="caption" weight="800" color="#4B5563">Skip</AppText>}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.doneBtn,
            { backgroundColor: 'rgba(37, 99, 235, 0.08)', borderColor: 'rgba(37, 99, 235, 0.15)' },
            pressed && styles.pressedBtn
          ]}
          onPress={handleStart}
        >
          <AppText variant="caption" weight="800" color="#2563EB">Start</AppText>
        </Pressable>
      </View>
    );
  }

  const timerExpired = elapsedSeconds >= targetDuration * 60;

  const doneBtnBg = isPremium ? 'rgba(212, 160, 23, 0.12)' : '#E8F5E9';
  const doneBtnBorder = isPremium ? 'rgba(212, 160, 23, 0.25)' : 'rgba(46, 125, 50, 0.15)';
  const doneBtnColor = isPremium ? '#B7791F' : '#2E7D32';

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
      <Pressable
        style={({ pressed }) => [
          styles.doneBtn,
          { backgroundColor: doneBtnBg, borderColor: doneBtnBorder },
          pressed && styles.pressedBtn
        ]}
        disabled={busy}
        onPress={handleComplete}
      >
        {busy ? <ActivityIndicator size="small" color={doneBtnColor} /> : <AppText variant="caption" weight="800" color={doneBtnColor}>Done</AppText>}
      </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#F3F4F6', // Clean light gray tint
    borderColor: '#E5E7EB', // Crisp contrast gray border
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pressedBtn: {
    transform: [{ scale: 0.96 }, { translateY: 2 }],
    opacity: 0.95,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
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
  // ── "In progress by another member" pill ──────────────────────
  inProgressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 160,
  },
  inProgressDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    flexShrink: 0,
  },
  inProgressText: {
    fontSize: 10,
    flexShrink: 1,
  },
});
