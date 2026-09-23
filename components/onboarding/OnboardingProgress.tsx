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

interface OnboardingDotProps {
  index: number;
  scrollX: SharedValue<number>;
  activeColor: string;
}

function OnboardingDot({ index, scrollX, activeColor }: OnboardingDotProps) {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    // Dynamic width interpolation
    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 28, 8],
      'clamp'
    );

    // Dynamic color interpolation
    const dotColor = interpolateColor(
      scrollX.value,
      inputRange,
      ['rgba(255, 255, 255, 0.35)', activeColor, 'rgba(255, 255, 255, 0.35)']
    );

    return {
      width: dotWidth,
      backgroundColor: dotColor,
    };
  });

  return (
    <Animated.View
      style={[styles.dot, animatedDotStyle]}
    />
  );
}

export function OnboardingProgress({ total, scrollX, activeColors }: OnboardingProgressProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <OnboardingDot
          key={index}
          index={index}
          scrollX={scrollX}
          activeColor={activeColors[index]}
        />
      ))}
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

