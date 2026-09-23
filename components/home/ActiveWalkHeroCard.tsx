import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing, Palette } from '@/constants/theme';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { queryClient } from '@/app/_layout';
import { useToast } from '@/hooks/useToast';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector } from '@/redux/store';
import { selectActivePetId } from '@/redux/reducer';
import { cancelTaskNotifications } from '@/lib/push/notificationSetup';

// Circular Radial Progress Ring metrics
const RING_SIZE = 48;
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

  // Subtle glowing pulse for the live active indicator
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
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
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.35,
            duration: 900,
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
  }, [activeWalk, glowOpacity]);

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

  // Tier Colors Theme Configuration:
  // - Free: Deep Navy gradient card with emerald progress ring & CTA
  // - Premium: Dark Forest/Emerald gradient with gold progress ring & CTA
  const theme = isPremium
    ? {
        cardBg: ['#0A2419', '#103923'] as const,
        borderColor: 'rgba(212, 160, 23, 0.45)',
        ringTrack: 'rgba(212, 160, 23, 0.2)',
        ringFill: '#F5C842',
        ringCenterBg: 'rgba(212, 160, 23, 0.12)',
        iconColor: '#F5C842',
        titleColor: '#FFFFFF',
        timerColor: '#F5C842',
        subtextColor: 'rgba(255, 255, 255, 0.65)',
        progressFillBg: '#D4A017',
        btnBg: ['#D4A017', '#B8860B'] as const,
        btnTextColor: '#FFFFFF',
        liveDotColor: '#F5C842',
      }
    : {
        cardBg: ['#1A2B4E', '#14223E'] as const,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        ringTrack: 'rgba(255, 255, 255, 0.15)',
        ringFill: '#5CB35D',
        ringCenterBg: 'rgba(92, 179, 93, 0.15)',
        iconColor: '#5CB35D',
        titleColor: '#FFFFFF',
        timerColor: '#FFFFFF',
        subtextColor: 'rgba(255, 255, 255, 0.65)',
        progressFillBg: '#2E7D32',
        btnBg: ['#2E7D32', '#1B5E20'] as const,
        btnTextColor: '#FFFFFF',
        liveDotColor: '#5CB35D',
      };

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={theme.cardBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: theme.borderColor }]}
      >
        {/* Top Progress Track Bar */}
        <View style={styles.topProgressTrack}>
          <View
            style={[
              styles.topProgressFill,
              {
                width: `${percentDone}%`,
                backgroundColor: theme.progressFillBg,
              },
            ]}
          />
        </View>

        <View style={styles.contentRow}>
          {/* Left: SVG Circular Radial Progress Ring */}
          <View style={styles.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svgRing}>
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

            <View style={[styles.innerCircle, { backgroundColor: theme.ringCenterBg }]}>
              <Animated.View style={{ opacity: glowOpacity }}>
                <Ionicons name="paw" size={19} color={theme.iconColor} />
              </Animated.View>
            </View>
          </View>

          {/* Middle: Title, Live Timer and Goal info */}
          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Animated.View
                style={[
                  styles.liveDot,
                  {
                    backgroundColor: theme.liveDotColor,
                    opacity: glowOpacity,
                  },
                ]}
              />
              <AppText
                variant="body"
                weight="800"
                color={theme.titleColor}
                numberOfLines={1}
                style={styles.walkTitle}
              >
                {activeWalk.title || 'Pet Walk'}
              </AppText>
            </View>

            {/* Live Timer Counter & Goal */}
            <View style={styles.timerRow}>
              <AppText variant="body" weight="800" color={theme.timerColor} style={styles.timerText}>
                {formatTimer(elapsedSeconds)}
              </AppText>
              <AppText variant="caption" weight="600" color={theme.subtextColor} style={styles.goalText}>
                / {targetMinutes} min ({percentDone}%)
              </AppText>
            </View>
          </View>

          {/* Right: Complete CTA Button */}
          <TouchableOpacity
            style={[styles.completeBtn, busy && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleComplete}
            disabled={busy}
          >
            <LinearGradient
              colors={theme.btnBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.btnTextColor} />
                  <AppText variant="caption" weight="800" color={theme.btnTextColor} style={styles.btnText}>
                    Finish
                  </AppText>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  card: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1.2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  topProgressTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  contentRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  svgRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  innerCircle: {
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  liveDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  walkTitle: {
    fontSize: 14,
    lineHeight: 18,
    flexShrink: 1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  timerText: {
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },
  goalText: {
    fontSize: 11,
    lineHeight: 15,
  },
  completeBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnGradient: {
    paddingHorizontal: 14,
    paddingVertical: 9.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btnText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
