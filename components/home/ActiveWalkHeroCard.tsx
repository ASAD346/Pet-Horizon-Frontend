import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, Platform, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { queryClient } from '@/app/_layout';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/redux/store';
import { selectActivePetId } from '@/redux/reducer';
import { cancelTaskNotifications } from '@/lib/push/notificationSetup';
import { homePillCard } from './homeStyles';

// Radial progress ring constants
const RING_SIZE = 40;
const STROKE_WIDTH = 3.5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ActiveWalkHeroCard() {
  const { activeWalk, stopWalk } = useActiveWalk();
  const { token } = useAuth();
  const { isPremium } = usePremiumStatus();
  const { showToast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [forceHidden, setForceHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subtle pulsing red/accent dot for live indicator
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const activePetId = useAppSelector(selectActivePetId);

  const busyRef = useRef(false);
  const handleCompleteRef = useRef<() => void>(() => {});

  // Reset forceHidden when a new active walk is loaded
  useEffect(() => {
    if (activeWalk) {
      setForceHidden(false);
      busyRef.current = false;
    }
  }, [activeWalk]);

  useEffect(() => {
    if (activeWalk) {
      setElapsedSeconds(Math.floor((Date.now() - activeWalk.startedAt) / 1000));
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeWalk.startedAt) / 1000);
        setElapsedSeconds(elapsed);

        // Automatically complete when target duration is reached
        const targetSecs = (activeWalk.targetDuration || 30) * 60;
        if (elapsed >= targetSecs && !busyRef.current) {
          busyRef.current = true;
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          void handleCompleteRef.current();
        }
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.35,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeWalk, pulseOpacity]);

  if (!activeWalk || forceHidden) return null;

  // Only display the card if the walk belongs to the currently active pet
  if (activeWalk.petId && activePetId && activeWalk.petId !== activePetId) {
    return null;
  }

  const targetMinutes = activeWalk.targetDuration || 30;
  const targetTotalSeconds = targetMinutes * 60;
  const progressRatio = Math.min(1, elapsedSeconds / targetTotalSeconds);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);
  const percentDone = Math.min(100, Math.round(progressRatio * 100));

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleComplete = () => {
    if (busy) return;
    setBusy(true);

    const finalSeconds = elapsedSeconds;
    const scheduleId = activeWalk.scheduleId;
    const minutes = Math.max(1, Math.round(finalSeconds / 60));

    // 1. Instantly hide card synchronously
    setForceHidden(true);

    // 2. Instantly clear local interval timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 3. Trigger API and clean up notifications asynchronously
    void stopWalk().catch(() => {});
    void cancelTaskNotifications(scheduleId).catch(() => {});

    if (token) {
      if (activePetId) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        queryClient.setQueryData(['dashboard', activePetId, todayStr], (prev: any) => {
          if (!prev || !prev.todaySchedules) return prev;
          const todaySchedules = { ...prev.todaySchedules };
          if (todaySchedules.walk) {
            todaySchedules.walk = (todaySchedules.walk as any[]).filter(
              (item) => item._id !== scheduleId && item.id !== scheduleId
            );
          }
          return {
            ...prev,
            todaySchedules,
          };
        });
      }

      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      completeWalkSchedule(token, scheduleId, {
        status: 'done',
        date: localDate,
        completedAt: new Date().toISOString(),
        duration: minutes,
      })
        .then(() => {
          showToast('Walk completed successfully! 🐾');
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['schedules'] });
          queryClient.invalidateQueries({ queryKey: ['activities'] });
        })
        .catch((err: any) => {
          showToast(err.message || 'Failed to complete walk.');
        })
        .finally(() => {
          setBusy(false);
          busyRef.current = false;
        });
    } else {
      setBusy(false);
      busyRef.current = false;
    }
  };
  handleCompleteRef.current = handleComplete;

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.45)'
    : 'rgba(37, 99, 235, 0.25)';

  const ringFillColor = isPremium ? '#D4A017' : '#2563EB';
  const ringTrackColor = isPremium ? 'rgba(212, 160, 23, 0.15)' : 'rgba(37, 99, 235, 0.12)';
  const doneBtnColor = isPremium ? '#D4A017' : '#3A8F3B';

  return (
    <View style={[homePillCard.card, styles.heroCard, { borderColor: cardBorderColor }]}>
      {/* Top progress accent bar */}
      <View style={styles.topBarTrack}>
        <View
          style={[
            styles.topBarFill,
            {
              width: `${percentDone}%`,
              backgroundColor: ringFillColor,
            },
          ]}
        />
      </View>

      <View style={styles.cardContent}>
        {/* Left: Circular Progress Ring with Paw Badge */}
        <View style={styles.ringWrapper}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={ringTrackColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={ringFillColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>

          <View style={[styles.innerBadge, { backgroundColor: isPremium ? 'rgba(212, 160, 23, 0.1)' : '#DBEAFE' }]}>
            <Ionicons name="paw" size={17} color={ringFillColor} />
          </View>
        </View>

        {/* Middle: Title, Live Status & Timer Progress */}
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Animated.View style={[styles.liveDot, { opacity: pulseOpacity }]} />
            <AppText
              style={styles.cardTitle}
              weight="800"
              color={HomeTheme.text}
              numberOfLines={1}
            >
              {activeWalk.title || 'Pet Walk'}
            </AppText>
          </View>

          <View style={styles.timerSubtitleRow}>
            <AppText
              style={styles.timerHighlight}
              weight="800"
              color={isPremium ? '#B8860B' : '#2563EB'}
            >
              {formatTimer(elapsedSeconds)}
            </AppText>
            <AppText
              style={styles.cardSubtitle}
              weight="600"
              color={HomeTheme.textMuted}
            >
              / {targetMinutes} min · {percentDone}%
            </AppText>
          </View>
        </View>

        {/* Right: Done / Finish CTA Button matching schedule pill styles */}
        <Pressable
          style={({ pressed }) => [
            styles.doneBtn,
            {
              backgroundColor: doneBtnColor,
              borderColor: doneBtnColor,
            },
            pressed && styles.pressedBtn,
            busy && styles.btnDisabled,
          ]}
          disabled={busy}
          onPress={handleComplete}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <AppText variant="caption" weight="800" color="#FFFFFF">
              Done
            </AppText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
    borderWidth: 1.2,
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
  },
  topBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#F3F4F6',
  },
  topBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  innerBadge: {
    width: RING_SIZE - STROKE_WIDTH * 2 - 4,
    height: RING_SIZE - STROKE_WIDTH * 2 - 4,
    borderRadius: (RING_SIZE - STROKE_WIDTH * 2 - 4) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
    justifyContent: 'center',
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    backgroundColor: '#EF4444', // Active live recording red
  },
  cardTitle: {
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  timerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  timerHighlight: {
    fontSize: 13,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  doneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7.5,
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
    transform: [{ scale: 0.96 }, { translateY: 1 }],
    opacity: 0.92,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
