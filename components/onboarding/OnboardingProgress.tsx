import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, interpolateColor, SharedValue } from 'react-native-reanimated';
import { Palette, Spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingProgressProps {
  total: number;
  scrollX: SharedValue<number>;
  activeColors: string[];
}

export function OnboardingProgress({ total, scrollX, activeColors }: OnboardingProgressProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => {
        const animatedDotStyle = useAnimatedStyle(() => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

          // Dynamic width interpolation
          const dotWidth = interpolate(
            scrollX.value,
            inputRange,
            [8, 24, 8],
            'clamp'
          );

          // Dynamic color interpolation
          const dotColor = interpolateColor(
            scrollX.value,
            inputRange,
            [Palette.gray[300], activeColors[index], Palette.gray[300]]
          );

          return {
            width: dotWidth,
            backgroundColor: dotColor,
          };
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, animatedDotStyle]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
