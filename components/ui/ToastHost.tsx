import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { LoginTheme, Radius, Spacing } from '@/constants/theme';
import { hideToastAction } from '@/redux/action';
import { selectToastMessage } from '@/redux/reducer';
import { useAppDispatch, useAppSelector } from '@/redux/store';

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const message = useAppSelector(selectToastMessage);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return undefined;

    if (hideTimer.current) clearTimeout(hideTimer.current);

    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) dispatch(hideToastAction());
      });
    }, 3200);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [message, opacity, dispatch]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity,
          bottom: Math.max(insets.bottom, Spacing.md) + Spacing.lg,
        },
      ]}
    >
      <AppText variant="bodySmall" weight="600" color={LoginTheme.footerText} style={styles.toastText}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#2E7D32',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  toastText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
