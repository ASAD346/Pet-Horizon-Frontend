import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

export type SkeletonTone = 'default' | 'dark' | 'muted';

const TONE_COLORS: Record<SkeletonTone, string> = {
  default: HomeTheme.surfaceMuted,
  dark: 'rgba(255,255,255,0.22)',
  muted: '#ECECEC',
};

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  tone?: SkeletonTone;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 14,
  borderRadius = Radius.sm,
  tone = 'default',
  style,
}: SkeletonProps) {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 850 }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: TONE_COLORS[tone],
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCircle({
  size = 48,
  tone = 'default',
  style,
}: {
  size?: number;
  tone?: SkeletonTone;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      tone={tone}
      style={style}
    />
  );
}

export interface SkeletonRowProps {
  avatarSize?: number;
  tone?: SkeletonTone;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonRow({ avatarSize = 46, tone = 'default', style }: SkeletonRowProps) {
  return (
    <View style={[styles.row, style]}>
      <SkeletonCircle size={avatarSize} tone={tone} />
      <View style={styles.rowText}>
        <Skeleton width="72%" height={14} tone={tone} />
        <Skeleton width="48%" height={11} tone={tone} style={styles.rowGap} />
      </View>
      <Skeleton width={52} height={14} tone={tone} />
    </View>
  );
}

export interface SkeletonListProps {
  count?: number;
  tone?: SkeletonTone;
  cardStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonList({
  count = 3,
  tone = 'default',
  cardStyle,
  style,
}: SkeletonListProps) {
  return (
    <View style={style}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.listCard, cardStyle]}>
          <SkeletonRow tone={tone} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  rowGap: {
    marginTop: 6,
  },
  listCard: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: HomeTheme.surfaceMuted,
  },
});
