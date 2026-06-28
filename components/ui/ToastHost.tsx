import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { LoginTheme, Radius, Spacing } from '@/constants/theme';
import { hideToastAction } from '@/redux/action';
import { selectToastMessage, selectToastType } from '@/redux/reducer';
import { useAppDispatch, useAppSelector } from '@/redux/store';

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const message = useAppSelector(selectToastMessage);
  const type = useAppSelector(selectToastType);
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

  let bgColor = '#333333';
  let textColor = '#FFFFFF';
  let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'information-circle';

  if (type === 'success') {
    bgColor = '#E8F5E9';
    textColor = '#1B5E20';
    iconName = 'checkmark-circle';
  } else if (type === 'error') {
    bgColor = '#FFEBEE';
    textColor = '#B71C1C';
    iconName = 'warning';
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity,
          bottom: Math.max(insets.bottom, Spacing.md) + Spacing.lg,
          backgroundColor: bgColor,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name={iconName} size={20} color={textColor} style={styles.icon} />
        <AppText variant="bodySmall" weight="700" color={textColor} style={styles.toastText}>
          {message}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  toastText: {
    textAlign: 'center',
    lineHeight: 18,
    flexShrink: 1,
  },
});
