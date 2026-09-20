import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/constants/theme';
import { hideToastAction } from '@/redux/action';
import { selectToastMessage, selectToastType } from '@/redux/reducer';
import { useAppDispatch, useAppSelector } from '@/redux/store';

/**
 * Global toast overlay.
 *
 * Renders as a top-level absolute overlay with pointerEvents="box-none" so that:
 * 1. Background touches pass 100% through to whatever is underneath (buttons, tabs, sheets remain fully interactive).
 * 2. The toast card itself responds to swipe-up and tap gestures to dismiss immediately.
 * 3. Automatically slides out after 3 seconds.
 */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const message = useAppSelector(selectToastMessage);
  const type = useAppSelector(selectToastType);

  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback((velocity?: number) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: velocity ? Math.max(120, 220 - Math.abs(velocity) * 40) : 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        dispatch(hideToastAction());
      }
    });
  }, [dispatch, opacity, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Dismiss if swiped up or tapped
        const isSwipeUp = gestureState.dy < -15 || gestureState.vy < -0.3;
        const isTap = Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8;

        if (isSwipeUp || isTap) {
          dismissToast(gestureState.vy);
        } else {
          // Snap back into place and restart 3s auto-dismiss timer
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();

          hideTimer.current = setTimeout(() => {
            dismissToast();
          }, 3000);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!message) {
      translateY.setValue(-150);
      opacity.setValue(0);
      return undefined;
    }

    if (hideTimer.current) clearTimeout(hideTimer.current);

    // Reset position before animating in
    translateY.setValue(-150);
    opacity.setValue(0);

    // Slide down + fade in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 140,
        mass: 0.8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      dismissToast();
    }, 3000);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [message, translateY, opacity, dismissToast]);

  if (!message) {
    return null;
  }

  // --- colour theme per type ---
  let title = 'Pet Horizon';
  let badgeColor = '#2E7D32';
  let bgColor = '#E8F5E9';
  let textColor = '#1B5E20';
  let descColor = '#2E7D32';

  if (type === 'success') {
    title = 'Success';
    badgeColor = '#2E7D32';
    bgColor = '#E8F5E9';
    textColor = '#1B5E20';
    descColor = '#2E7D32';
  } else if (type === 'error') {
    title = 'Alert';
    badgeColor = '#C62828';
    bgColor = '#FFEBEE';
    textColor = '#C62828';
    descColor = '#D32F2F';
  } else if (type === 'info') {
    title = 'Info';
    badgeColor = '#2E7D32';
    bgColor = '#E8F5E9';
    textColor = '#1B5E20';
    descColor = '#2E7D32';
  }

  return (
    <Modal
      visible={Boolean(message)}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => dismissToast()}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.toastContainer,
            {
              opacity,
              transform: [{ translateY }],
              top: Math.max(insets.top, 12),
            },
          ]}
        >
          <View style={[styles.notificationCard, { backgroundColor: bgColor }]}>
            {/* Header row */}
            <View style={styles.headerRow}>
              <View style={styles.appIdentity}>
                <View style={styles.tagWrapper}>
                  <AppText variant="caption" weight="800" color={badgeColor} style={styles.tagText}>
                    PH
                  </AppText>
                  <View style={[styles.tagUnderline, { backgroundColor: badgeColor }]} />
                </View>
                <AppText variant="caption" weight="600" color={textColor} style={styles.appName}>
                  Pet Horizon
                </AppText>
                <Ionicons name="notifications" size={12} color={descColor} style={styles.bellIcon} />
              </View>
              <View style={styles.chevronWrapper}>
                <Ionicons name="chevron-up" size={14} color={descColor} />
              </View>
            </View>

            {/* Content row */}
            <View style={styles.contentRow}>
              <View style={styles.textContainer}>
                <AppText variant="bodySmall" weight="700" color={textColor} style={styles.titleText}>
                  {title}
                </AppText>
                <AppText variant="caption" weight="500" color={descColor} style={styles.bodyText}>
                  {message}
                </AppText>
              </View>
              <View style={[styles.rightLogo, { borderColor: badgeColor, backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                <Ionicons name="paw" size={16} color={badgeColor} />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999999,
  },
  toastContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  notificationCard: {
    width: '100%',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
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
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
