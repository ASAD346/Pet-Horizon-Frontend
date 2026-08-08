import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { hideToastAction } from '@/redux/action';
import { selectToastMessage, selectToastType } from '@/redux/reducer';
import { useAppDispatch, useAppSelector } from '@/redux/store';

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const message = useAppSelector(selectToastMessage);
  const type = useAppSelector(selectToastType);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return undefined;

    if (hideTimer.current) clearTimeout(hideTimer.current);

    // Slide down and fade in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      // Slide up and fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) dispatch(hideToastAction());
      });
    }, 4000);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [message, translateY, opacity, dispatch]);

  if (!message) return null;

  let title = 'Pet Horizon';
  let badgeColor = '#4CAF50'; // standard green

  if (type === 'success') {
    title = 'Success';
    badgeColor = '#4CAF50';
  } else if (type === 'error') {
    title = 'Alert';
    badgeColor = '#F44336';
  } else if (type === 'info') {
    title = 'Info';
    badgeColor = '#3A8F3B';
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastContainer,
        {
          opacity,
          transform: [{ translateY }],
          top: Math.max(insets.top, 12),
        },
      ]}
    >
      <View style={styles.notificationCard}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.appIdentity}>
            <View style={styles.tagWrapper}>
              <AppText variant="caption" weight="800" color={badgeColor} style={styles.tagText}>
                PH
              </AppText>
              <View style={[styles.tagUnderline, { backgroundColor: badgeColor }]} />
            </View>
            <AppText variant="caption" weight="600" color="#9E9E9E" style={styles.appName}>
              Pet Horizon
            </AppText>
            <Ionicons name="notifications" size={12} color="#757575" style={styles.bellIcon} />
          </View>

          <View style={styles.chevronWrapper}>
            <Ionicons name="chevron-down" size={14} color="#757575" />
          </View>
        </View>

        {/* Content Row */}
        <View style={styles.contentRow}>
          <View style={styles.textContainer}>
            <AppText variant="bodySmall" weight="700" color="#FFFFFF" style={styles.titleText}>
              {title}
            </AppText>
            <AppText variant="caption" weight="500" color="#E0E0E0" style={styles.bodyText}>
              {message}
            </AppText>
          </View>

          {/* Right Icon/Logo representation */}
          <View style={[styles.rightLogo, { borderColor: badgeColor }]}>
            <Ionicons name="paw" size={16} color={badgeColor} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 99999,
    alignItems: 'center',
  },
  notificationCard: {
    width: '100%',
    backgroundColor: '#262626', // Premium dark slate/charcoal background
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagWrapper: {
    alignItems: 'center',
  },
  tagText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
  },
  tagUnderline: {
    width: 14,
    height: 1.5,
    marginTop: 1,
    borderRadius: 1,
  },
  appName: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  bellIcon: {
    marginLeft: 2,
  },
  chevronWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontSize: 14,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  rightLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
