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

export function ActiveWalkOverlay() {
  const { activeWalk, stopWalk } = useActiveWalk();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values for the pulsing ring
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

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

  if (!activeWalk) return null;

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

  const handleComplete = async () => {
    if (busy) return;
    setBusy(true);
    const finalSeconds = elapsedSeconds;

    try {
      const minutes = Math.max(1, Math.round(finalSeconds / 60));
      
      // Stop the timer and clear state locally first
      await stopWalk();

      if (token) {
        await completeWalkSchedule(token, activeWalk.scheduleId, {
          status: 'done',
          completedAt: new Date().toISOString(),
          duration: minutes,
        });
        showToast('Walk completed successfully! 🐾');
        // Refresh dashboard to show the new recent activity
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to complete walk.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {
        // Persistent/Non-dismissible
      }}
    >
      <View style={styles.backdrop}>
        <LinearGradient
          colors={['#FFFFFF', '#F9FBF9']}
          style={styles.container}
        >
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
            <View style={styles.iconCircle}>
              <Ionicons name="walk" size={32} color="#2E7D32" />
            </View>
          </View>

          {/* Heading */}
          <AppText variant="h2" weight="800" color="#1A2B4E" style={styles.title}>
            Walk in Progress
          </AppText>

          <AppText variant="body" weight="600" color="#616161" style={styles.subtitle}>
            {activeWalk.title || 'Ongoing Walk'}
          </AppText>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <AppText variant="h1" weight="800" color="#2E7D32" style={styles.timerText}>
              {formatTimer(elapsedSeconds)}
            </AppText>
          </View>

          {/* Action CTA Button */}
          <TouchableOpacity
            style={[styles.btn, busy && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleComplete}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" style={styles.btnIcon} />
                <AppText variant="body" weight="700" color="#FFFFFF">
                  Complete Walk
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.55)', // Elegant Navy-tinted semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  indicatorWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#2E7D32',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  timerContainer: {
    backgroundColor: '#E8F5E9', // SuccessLight background
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.12)',
  },
  timerText: {
    fontSize: 52,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textShadowColor: 'rgba(46, 125, 50, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  btn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2E7D32', // Matches brand success green
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  btnDisabled: {
    backgroundColor: '#1B5E20',
    opacity: 0.7,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  btnIcon: {
    marginRight: Spacing.sm,
  },
});
