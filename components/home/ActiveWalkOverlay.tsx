import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAuth } from '@/hooks/useAuth';
import { completeWalkSchedule } from '@/services/schedules/walkApi';
import { queryClient } from '@/app/_layout';
import { useToast } from '@/hooks/useToast';

export function ActiveWalkOverlay() {
  const { activeWalk, stopWalk } = useActiveWalk();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeWalk) {
      setElapsedSeconds(Math.floor((Date.now() - activeWalk.startedAt) / 1000));
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - activeWalk.startedAt) / 1000));
      }, 1000);
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
        <View style={styles.container}>
          <View style={styles.pulseContainer}>
            <View style={styles.pulseRing} />
            <View style={styles.pulseDot} />
          </View>

          <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.title}>
            Walk in Progress
          </AppText>

          <AppText variant="bodySmall" color="#A3A3A3" style={styles.subtitle}>
            {activeWalk.title || 'Ongoing Walk'}
          </AppText>

          <View style={styles.timerContainer}>
            <AppText variant="h1" weight="800" color="#22C55E" style={styles.timerText}>
              {formatTimer(elapsedSeconds)}
            </AppText>
          </View>

          <TouchableOpacity
            style={[styles.btn, busy && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleComplete}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" style={styles.btnIcon} />
                <AppText variant="body" weight="700" color="#FFFFFF">
                  Complete Walk
                </AppText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.92)', // Premium deep dark theme backdrop
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#18181B', // Dark charcoal card
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)', // Green accent glow
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pulseContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#22C55E',
    opacity: 0.5,
  },
  pulseDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  timerContainer: {
    backgroundColor: '#09090B',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  timerText: {
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E', // Solid green CTA
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnDisabled: {
    backgroundColor: '#15803D',
    opacity: 0.8,
  },
  btnIcon: {
    marginRight: Spacing.xs,
  },
});
