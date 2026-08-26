import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Modal, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing, Palette } from '@/constants/theme';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAuth } from '@/hooks/useAuth';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { queryClient } from '@/app/_layout';
import { useToast } from '@/hooks/useToast';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector } from '@/redux/store';
import { selectActivePetId } from '@/redux/reducer';
import { cancelTaskNotifications } from '@/lib/push/notificationSetup';

export function ActiveWalkOverlay() {
  const { activeWalk, stopWalk } = useActiveWalk();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [forceHidden, setForceHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values for the pulsing ring
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  const activePetId = useAppSelector(selectActivePetId);

  // Reset forceHidden when a new active walk is loaded
  useEffect(() => {
    if (activeWalk) {
      setForceHidden(false);
    }
  }, [activeWalk]);

  useEffect(() => {
    if (activeWalk) {
      setElapsedSeconds(Math.floor((Date.now() - activeWalk.startedAt) / 1000));
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - activeWalk.startedAt) / 1000));
      }, 1000);

      // Start the looping pulse animation
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.6);
      Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 2000,
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
  }, [activeWalk]);

  if (!activeWalk || forceHidden) return null;

  // Only display the overlay if the walk belongs to the currently active pet
  if (activeWalk.petId && activePetId && activeWalk.petId !== activePetId) {
    return null;
  }

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

    // 1. Instantly hide the modal synchronously
    setForceHidden(true);

    // 2. Instantly clear local interval timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 3. Trigger API and clear states in background asynchronously without blocking UI
    void stopWalk().catch(() => {});
    void cancelTaskNotifications(scheduleId).catch(() => {});

    if (token) {
      // Optimistically remove from dashboard query cache to clean up view instantly
      if (activePetId) {
        const todayStr = new Date().toISOString().split('T')[0];
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

      completeWalkSchedule(token, scheduleId, {
        status: 'done',
        completedAt: new Date().toISOString(),
        duration: minutes,
      })
        .then(() => {
          showToast('Walk completed successfully! 🐾');
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['schedules'] });
        })
        .catch((err: any) => {
          showToast(err.message || 'Failed to complete walk.');
        })
        .finally(() => {
          setBusy(false);
        });
    } else {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Subtle top decoration line */}
          <View style={styles.topAccent} />

          {/* Pulsing Walk Indicator */}
          <View style={styles.indicatorWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <LinearGradient
              colors={['#E8F5E9', '#C8E6C9']}
              style={styles.iconCircle}
            >
              <Ionicons name="paw" size={32} color="#2E7D32" />
            </LinearGradient>
          </View>

          {/* Heading */}
          <AppText variant="h2" weight="800" color="#0F172A" style={styles.title}>
            Walk in Progress
          </AppText>

          <AppText variant="body" weight="600" color="#64748B" style={styles.subtitle}>
            {activeWalk.title || 'Ongoing Walk'}
          </AppText>

          {/* Timer Display */}
          <View style={styles.timerWrapper}>
            <AppText variant="h1" weight="800" color="#1E4620" style={styles.timerText}>
              {formatTimer(elapsedSeconds)}
            </AppText>
          </View>

          {/* Subtle helper text */}
          <AppText variant="caption" weight="500" color="#94A3B8" style={styles.helperText}>
            Timer runs in background if you leave the app
          </AppText>

          {/* Action CTA Button */}
          <TouchableOpacity
            style={[styles.btn, busy && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleComplete}
            disabled={busy}
          >
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={styles.btnIcon} />
                  <AppText variant="body" weight="700" color="#FFFFFF">
                    Complete Walk
                  </AppText>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Deep premium slate backdrop overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  cardContainer: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl + 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  topAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    position: 'absolute',
    top: 12,
  },
  indicatorWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  timerWrapper: {
    backgroundColor: '#F1F8F3', // Soft pastel mint green
    width: '100%',
    paddingVertical: Spacing.md + 2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.08)',
    marginBottom: Spacing.sm,
  },
  timerText: {
    fontSize: 48,
    lineHeight: 54,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.5,
  },
  helperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnGradient: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 6,
  },
});
