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

  const activePetId = useAppSelector(selectActivePetId);

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
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {/* Pulsing Walk Icon */}
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
            <Ionicons name="walk" size={20} color="#2E7D32" />
          </View>
        </View>

        {/* Text Info */}
        <View style={styles.textContainer}>
          <AppText variant="caption" weight="600" color="#757575" style={styles.title}>
            Walk in Progress
          </AppText>
          <AppText variant="h3" weight="800" color="#2E7D32" style={styles.timerText}>
            {formatTimer(elapsedSeconds)}
          </AppText>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.btn, busy && styles.btnDisabled]}
        activeOpacity={0.85}
        onPress={handleComplete}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.btnContent}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <AppText variant="body" weight="700" color="#FFFFFF" style={styles.btnText}>
              Complete
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 40, // Positioned safely at the top below the status bar
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
    borderColor: 'rgba(46, 125, 50, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indicatorWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  pulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  timerText: {
    fontSize: 20,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  btn: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2E7D32',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  btnDisabled: {
    backgroundColor: '#1B5E20',
    opacity: 0.7,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 4,
  },
  btnText: {
    fontSize: 13,
    lineHeight: 16,
  },
});
