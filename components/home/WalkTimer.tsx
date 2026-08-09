import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalkTimerProps {
  scheduleId: string;
  isDone: boolean;
  isSkipped: boolean;
  isPremium: boolean;
  onComplete: (id: string, elapsedMinutes?: number) => void | Promise<void>;
  onSkip: (id: string) => void | Promise<void>;
}

export function WalkTimer({
  scheduleId,
  isDone,
  isSkipped,
  isPremium,
  onComplete,
  onSkip,
}: WalkTimerProps) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load any running state on mount
  useEffect(() => {
    const loadWalkState = async () => {
      try {
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

  // Keep the counter ticking if active
  useEffect(() => {
    if (startedAt !== null) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startedAt]);

  const handleStart = async () => {
    const now = Date.now();
    setStartedAt(now);
    try {
      await AsyncStorage.setItem(`walk_timer_started_${scheduleId}`, String(now));
    } catch (_) {}
  };

  const handleComplete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
      await onComplete(scheduleId, minutes);
      await AsyncStorage.removeItem(`walk_timer_started_${scheduleId}`);
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
      await AsyncStorage.removeItem(`walk_timer_started_${scheduleId}`);
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

  return (
    <View style={styles.actionRow}>
      <View style={styles.timerWrapper}>
        <View style={styles.pulseDot} />
        <AppText variant="caption" weight="800" color="#2563EB" style={styles.timerText}>
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
