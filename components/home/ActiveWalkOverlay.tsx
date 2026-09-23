import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius } from '@/constants/theme';
import { useActiveWalk } from '@/context/ActiveWalkContext';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
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
  const { isPremium } = usePremiumStatus();
  const { fabBottom } = useTabBarLayout();
  const { showToast } = useToast();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [forceHidden, setForceHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values for pulsing ring & entrance slide
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const activePetId = useAppSelector(selectActivePetId);

  // Reset forceHidden when a new active walk is loaded
  useEffect(() => {
    if (activeWalk) {
      setForceHidden(false);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeWalk, slideAnim, fadeAnim]);

  useEffect(() => {
    if (activeWalk) {
      setElapsedSeconds(Math.floor((Date.now() - activeWalk.startedAt) / 1000));
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - activeWalk.startedAt) / 1000));
      }, 1000);

      // Start looping pulse animation
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.6);
      Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.6,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1800,
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
  }, [activeWalk, pulseScale, pulseOpacity]);

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

    // 1. Instantly hide the banner synchronously
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

  // Tier Colors Theme Configuration:
  // - Free tier: Deep Navy gradient card, brand green live pulse & accent, green finish CTA
  // - Premium tier: Rich Dark Emerald & Forest gradient card with Gold border & Gold CTA
  const theme = isPremium
    ? {
        cardBg: ['#0A2419', '#103923'] as const,
        borderColor: 'rgba(212, 160, 23, 0.45)',
        pulseBorder: 'rgba(212, 160, 23, 0.55)',
        iconCircleBg: 'rgba(212, 160, 23, 0.18)',
        iconColor: '#F5C842',
        titleColor: '#FFFFFF',
        timerColor: '#F5C842',
        badgeBg: 'rgba(212, 160, 23, 0.25)',
        badgeText: '#FDE68A',
        badgeLabel: 'PREMIUM WALK',
        btnBg: ['#D4A017', '#B8860B'] as const,
        btnTextColor: '#FFFFFF',
        btnShadow: '#D4A017',
      }
    : {
        cardBg: ['#1A2B4E', '#14223E'] as const,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        pulseBorder: 'rgba(92, 179, 93, 0.5)',
        iconCircleBg: 'rgba(92, 179, 93, 0.18)',
        iconColor: '#5CB35D',
        titleColor: '#FFFFFF',
        timerColor: '#FFFFFF',
        badgeBg: 'rgba(92, 179, 93, 0.2)',
        badgeText: '#A7F3D0',
        badgeLabel: 'IN PROGRESS',
        btnBg: ['#2E7D32', '#1B5E20'] as const,
        btnTextColor: '#FFFFFF',
        btnShadow: '#1B5E20',
      };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.floatingContainer,
        {
          bottom: fabBottom + 4,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={theme.cardBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: theme.borderColor }]}
      >
        {/* Left Section: Pulsing Icon & Live Status */}
        <View style={styles.leftCol}>
          <View style={styles.iconWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: theme.pulseBorder,
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <View style={[styles.iconCircle, { backgroundColor: theme.iconCircleBg }]}>
              <Ionicons name="paw" size={18} color={theme.iconColor} />
            </View>
          </View>

          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <AppText
                variant="body"
                weight="700"
                color={theme.titleColor}
                numberOfLines={1}
                style={styles.walkTitle}
              >
                {activeWalk.title || 'Pet Walk'}
              </AppText>
              <View style={[styles.badgePill, { backgroundColor: theme.badgeBg }]}>
                <AppText variant="caption" weight="800" color={theme.badgeText} style={styles.badgeText}>
                  {theme.badgeLabel}
                </AppText>
              </View>
            </View>

            {/* Live Timer Counter */}
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={13} color={theme.timerColor} style={styles.timerIcon} />
              <AppText variant="body" weight="800" color={theme.timerColor} style={styles.timerText}>
                {formatTimer(elapsedSeconds)}
              </AppText>
            </View>
          </View>
        </View>

        {/* Right Section: Complete CTA Button */}
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
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  walkTitle: {
    fontSize: 14,
    lineHeight: 18,
    flexShrink: 1,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.3,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerIcon: {
    opacity: 0.85,
  },
  timerText: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
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
    paddingVertical: 9,
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
