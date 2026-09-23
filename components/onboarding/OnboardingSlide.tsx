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
  // Pure subtle scale for background image (stays stable, no horizontal flying)
  const animatedImageStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [1.05, 1, 1.05], 'clamp');
    return {
      transform: [{ scale }],
    };
  });

  // Apple-style smooth fade & subtle vertical float (no aggressive horizontal flying)
  const animatedTextWrapperStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 0.7) * width, index * width, (index + 0.7) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], 'clamp');
    const translateY = interpolate(scrollX.value, inputRange, [14, 0, -14], 'clamp');

    return {
      opacity,
      transform: [{ translateY }],
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

      {/* Seamless Minimalist Typography Section with Apple-Style smooth Fade & Float */}
      <Animated.View style={[styles.textWrapper, animatedTextWrapperStyle]}>
        {/* Subtle Category Pill */}
        <View style={[styles.badge, { backgroundColor: `${slide.accentColor}33`, borderColor: `${slide.accentColor}77` }]}>
          <View style={[styles.badgeDot, { backgroundColor: slide.accentColor }]} />
          <AppText variant="caption" weight="800" color={Palette.white} style={styles.badgeText}>
            {slide.badgeText.toUpperCase()}
          </AppText>
        </View>

        {/* Clean Hero Title */}
        <AppText variant="h1" align="left" style={styles.title} weight="800">
          {slide.title}
        </AppText>

        {/* Subtitle / Description */}
        <AppText variant="body" align="left" style={styles.description} color="rgba(255, 255, 255, 0.78)">
          {slide.description}
        </AppText>
      </Animated.View>
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


