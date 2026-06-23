import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from '../ui/AppText';
import { Palette, Spacing, Radius } from '../../constants/theme';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Responsive dimensions
const CARD_WIDTH = width * 0.82;
const CARD_HEIGHT = height * 0.35;

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
  // Smooth scroll animations
  const animatedIllustrationStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], 'clamp');
    const rotate = interpolate(scrollX.value, inputRange, [-4, 0, 4], 'clamp');
    const opacity = interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], 'clamp');

    return {
      transform: [
        { scale },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 0.5) * width, index * width, (index + 0.5) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], 'clamp');
    const translateY = interpolate(scrollX.value, inputRange, [12, 0, -12], 'clamp');

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.slideContainer}>
      <Animated.View 
        style={[
          styles.cardContainer, 
          animatedIllustrationStyle
        ]}
      >
        {/* Glow backdrop behind the card matching the slide accent color */}
        <View style={[styles.glowBackdrop, { backgroundColor: slide.accentColor + '0A' }]} />
        
        {/* Premium Floating Card */}
        <View style={styles.illustrationCard}>
          <Image
            source={slide.image}
            style={styles.image}
            contentFit="cover" // Blend the image edge-to-edge
          />
        </View>

        {/* Themed Badge */}
        <View style={[styles.badge, { backgroundColor: slide.accentColor }]}>
          <AppText variant="caption" weight="800" color={Palette.white}>
            {slide.badgeText.toUpperCase()}
          </AppText>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <AppText variant="h2" align="center" style={styles.title} weight="800">
          {slide.title}
        </AppText>
        
        <AppText variant="body" align="center" style={styles.description} color={Palette.gray[600]}>
          {slide.description}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slideContainer: {
    width: width,
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: Spacing.xl,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowBackdrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    transform: [{ scale: 1.06 }],
  },
  illustrationCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: Palette.white,
    overflow: 'hidden',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: -12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.full,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  textContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.xs,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    color: Palette.primary.base,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: width * 0.85,
  },
});
