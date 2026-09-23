import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../ui/AppText';
import { Palette, Spacing, Radius } from '../../constants/theme';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export interface SlideData {
  id: string;
  title: string;
  description: string;
  image: any;
  accentColor: string;
  bgColor: string;
  badgeText: string;
}

interface OnboardingSlideProps {
  slide: SlideData;
  index: number;
  scrollX: SharedValue<number>;
}

export function OnboardingSlide({ slide, index, scrollX }: OnboardingSlideProps) {
  // Parallax background image interpolation (moves at 0.5x speed + zooms for deep cinematic feel)
  const animatedImageStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-width * 0.45, 0, width * 0.45],
      'clamp'
    );
    const scale = interpolate(scrollX.value, inputRange, [1.18, 1, 1.18], 'clamp');

    return {
      transform: [{ translateX }, { scale }],
    };
  });

  // Staggered text & badge animations
  const animatedBadgeStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], 'clamp');
    const translateX = interpolate(scrollX.value, inputRange, [-60, 0, 60], 'clamp');
    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], 'clamp');

    return {
      opacity,
      transform: [{ translateX }, { scale }],
    };
  });

  const animatedTitleStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], 'clamp');
    const translateX = interpolate(scrollX.value, inputRange, [-80, 0, 80], 'clamp');
    const translateY = interpolate(scrollX.value, inputRange, [20, 0, -20], 'clamp');

    return {
      opacity,
      transform: [{ translateX }, { translateY }],
    };
  });

  const animatedDescStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], 'clamp');
    const translateX = interpolate(scrollX.value, inputRange, [-50, 0, 50], 'clamp');
    const translateY = interpolate(scrollX.value, inputRange, [30, 0, -30], 'clamp');

    return {
      opacity,
      transform: [{ translateX }, { translateY }],
    };
  });

  return (
    <View style={styles.slideContainer}>
      {/* Full-Screen Background Image with subtle zoom */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedImageStyle]}>
          <Image
            source={slide.image}
            style={styles.backgroundImage}
            contentFit="cover"
            priority="high"
          />
        </Animated.View>
        
        {/* Cinematic Multi-Stop Gradient for seamless readability */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0.05)',
            'rgba(10,14,24,0.3)',
            'rgba(10,14,24,0.82)',
            'rgba(7,10,18,0.98)'
          ]}
          locations={[0, 0.28, 0.52, 0.76, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Seamless Minimalist Typography Section */}
      <View style={styles.textWrapper}>
        {/* Subtle Category Pill */}
        <Animated.View style={[styles.badge, { backgroundColor: `${slide.accentColor}33`, borderColor: `${slide.accentColor}77` }, animatedBadgeStyle]}>
          <View style={[styles.badgeDot, { backgroundColor: slide.accentColor }]} />
          <AppText variant="caption" weight="800" color={Palette.white} style={styles.badgeText}>
            {slide.badgeText.toUpperCase()}
          </AppText>
        </Animated.View>

        {/* Clean Hero Title */}
        <Animated.View style={animatedTitleStyle}>
          <AppText variant="h1" align="left" style={styles.title} weight="800">
            {slide.title}
          </AppText>
        </Animated.View>

        {/* Subtitle / Description */}
        <Animated.View style={animatedDescStyle}>
          <AppText variant="body" align="left" style={styles.description} color="rgba(255, 255, 255, 0.78)">
            {slide.description}
          </AppText>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slideContainer: {
    width: width,
    height: height,
    justifyContent: 'flex-end',
    paddingBottom: 130, // Space above bottom navigation controls
    paddingHorizontal: Spacing.xl,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    width: '100%',
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: Palette.white,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});


