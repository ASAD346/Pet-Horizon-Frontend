import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { hideToastAction } from '@/redux/action';
import { selectToastMessage, selectToastType } from '@/redux/reducer';
import { useAppDispatch, useAppSelector } from '@/redux/store';

/**
 * Global toast overlay.
 *
 * Renders inside its own transparent <Modal> so it always sits above every
 * other Modal / bottom-sheet in the app without needing duplicate instances.
 * The outer View has pointerEvents="none" so all touches pass through to
 * whatever is underneath (active sheets remain fully interactive).
 */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const message = useAppSelector(selectToastMessage);
  const type = useAppSelector(selectToastType);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) {
      // Immediately reset when cleared
      translateY.setValue(-120);
      opacity.setValue(0);
      return undefined;
    }

    if (hideTimer.current) clearTimeout(hideTimer.current);

    // Reset position before animating in (handles rapid re-triggers)
    translateY.setValue(-120);
    opacity.setValue(0);

    // Slide down + fade in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      // Slide up + fade out then clear Redux state
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
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

  // --- colour theme per type ---
  let title = 'Pet Horizon';
  let badgeColor = '#2E7D32';
  let bgColor = '#E8F5E9';
  let textColor = '#1B5E20';
  let descColor = '#2E7D32';

  if (type === 'success') {
    title = 'Success';
    badgeColor = '#2E7D32'; bgColor = '#E8F5E9';
    textColor = '#1B5E20'; descColor = '#2E7D32';
  } else if (type === 'error') {
    title = 'Alert';
    badgeColor = '#C62828'; bgColor = '#FFEBEE';
    textColor = '#C62828'; descColor = '#D32F2F';
  } else if (type === 'info') {
    title = 'Info';
    badgeColor = '#2E7D32'; bgColor = '#E8F5E9';
    textColor = '#1B5E20'; descColor = '#2E7D32';
  }

  return (
    /**
     * transparent Modal → native window always above every other Modal.
     * visible only when a message exists so the Modal is not mounted
     * unnecessarily.
     */
    <Modal
      visible={!!message}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => { /* block hardware-back from closing toast */ }}
    >
      {/* pointerEvents="none" → touches fall through to the sheet below */}
      <View style={styles.passThrough} pointerEvents="none">
        <Animated.View
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
                <Ionicons name="chevron-down" size={14} color={descColor} />
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
  /** Fills the whole screen but passes all touches through */
  passThrough: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
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
