import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, Platform, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { queryClient } from '@/app/_layout';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/redux/store';
import { selectActivePetId } from '@/redux/reducer';
import { cancelTaskNotifications } from '@/lib/push/notificationSetup';

// Radial progress ring constants
const RING_SIZE = 46;
const STROKE_WIDTH = 4;
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

  // Subtle pulsing glow for live indicator
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
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
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

  // Premium & Free Theme Tokens
  const theme = isPremium
    ? {
        cardBg: ['#FFFFFF', '#FFFDF7'] as const,
        borderColor: 'rgba(212, 160, 23, 0.4)',
        ringTrack: 'rgba(212, 160, 23, 0.15)',
        ringFill: '#D4A017',
        badgeBg: '#FFF9E6',
        iconColor: '#B8860B',
        accentBadgeBg: '#FEF3C7',
        accentBadgeText: '#92400E',
        timerColor: '#92400E',
        trackBg: '#FEF9EE',
        btnBg: ['#D4A017', '#B8860B'] as const,
        btnTextColor: '#FFFFFF',
      }
    : {
        cardBg: ['#FFFFFF', '#F6FBF7'] as const,
        borderColor: 'rgba(46, 125, 50, 0.25)',
        ringTrack: 'rgba(46, 125, 50, 0.12)',
        ringFill: '#2E7D32',
        badgeBg: '#E8F5E9',
        iconColor: '#2E7D32',
        accentBadgeBg: '#E8F5E9',
        accentBadgeText: '#1B5E20',
        timerColor: '#1B5E20',
        trackBg: '#F0FDF4',
        btnBg: ['#2E7D32', '#1B5E20'] as const,
        btnTextColor: '#FFFFFF',
      };

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={theme.cardBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: theme.borderColor }]}
      >
        {/* Top Progress Accent Bar */}
        <View style={[styles.topProgressTrack, { backgroundColor: theme.trackBg }]}>
          <View
            style={[
              styles.topProgressFill,
              {
                width: `${percentDone}%`,
                backgroundColor: theme.ringFill,
              },
            ]}
          />
        </View>

        <View style={styles.mainRow}>
          {/* Left: SVG Circular Radial Progress Ring + Paw Badge */}
          <View style={styles.ringWrapper}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={theme.ringTrack}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={theme.ringFill}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>

            <View style={[styles.innerPawCircle, { backgroundColor: theme.badgeBg }]}>
              <Ionicons name="paw" size={20} color={theme.iconColor} />
            </View>
          </View>

          {/* Middle: Title, Live Tag & Timer Progress Stats */}
          <View style={styles.infoCol}>
            <View style={styles.titleHeaderRow}>
              <AppText
                variant="body"
                weight="800"
                color="#0F172A"
                numberOfLines={1}
                style={styles.walkTitle}
              >
                {activeWalk.title || 'Current Walk'}
              </AppText>
              
              <View style={[styles.liveTag, { backgroundColor: theme.accentBadgeBg }]}>
                <Animated.View style={[styles.liveDot, { opacity: pulseOpacity }]} />
                <AppText variant="caption" weight="800" color={theme.accentBadgeText} style={styles.liveTagText}>
                  LIVE
                </AppText>
              </View>
            </View>

            {/* Timer Counter & Goal percentage pill */}
            <View style={styles.metaRow}>
              <View style={styles.timerPill}>
                <Ionicons name="time-outline" size={13} color={theme.timerColor} style={{ marginRight: 3 }} />
                <AppText variant="body" weight="800" color={theme.timerColor} style={styles.timerDigits}>
                  {formatTimer(elapsedSeconds)}
                </AppText>
              </View>
              <AppText variant="caption" weight="600" color="#64748B" style={styles.goalText}>
                Goal: {targetMinutes} min ({percentDone}%)
              </AppText>
            </View>
          </View>

          {/* Right: Done CTA Button */}
          <Pressable
            style={({ pressed }) => [
              styles.finishBtn,
              pressed && styles.finishBtnPressed,
              busy && styles.btnDisabled,
            ]}
            disabled={busy}
            onPress={handleComplete}
          >
            <LinearGradient
              colors={theme.btnBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.finishBtnGradient}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.finishBtnContent}>
                  <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                  <AppText variant="caption" weight="800" color="#FFFFFF">
                    Done
                  </AppText>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginBottom: Spacing.sm,
    marginHorizontal: 0,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  topProgressTrack: {
    width: '100%',
    height: 3.5,
  },
  topProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  innerPawCircle: {
    width: RING_SIZE - STROKE_WIDTH * 2 - 4,
    height: RING_SIZE - STROKE_WIDTH * 2 - 4,
    borderRadius: (RING_SIZE - STROKE_WIDTH * 2 - 4) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
    gap: 3,
  },
  titleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walkTitle: {
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveTagText: {
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerDigits: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  goalText: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  finishBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  finishBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  finishBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  finishBtnPressed: {
    transform: [{ scale: 0.95 }, { translateY: 1 }],
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
