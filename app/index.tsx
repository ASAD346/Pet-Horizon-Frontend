import React, { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthEntryLoader, useAuthEntryRedirect } from '@/components/auth/AuthEntryRedirect';
import { useAuth } from '@/hooks/useAuth';
import { AppText } from '../components/ui/AppText';
import { Palette, Spacing, Radius } from '../constants/theme';
import { OnboardingSlide, SlideData } from '../components/onboarding/OnboardingSlide';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolateColor,
  runOnJS,
  withSpring
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES: SlideData[] = [
  {
    id: '1',
    title: 'Track Every Moment',
    description: 'Log daily activities like meals, walks, medicines, vaccine logs, and grooming events in a neat timeline.',
    image: require('../assets/images/onboarding_tracking.png'),
    accentColor: '#5CB35D', // Green
    bgColor: '#F0F8F0',
    badgeText: 'Care Tracking',
  },
  {
    id: '2',
    title: 'Share with Family',
    description: 'Invite sitters and family to co-manage pets together. Stay perfectly in sync and never miss a task.',
    image: require('../assets/images/onboarding_family.png'),
    accentColor: '#1A2B4E', // Navy
    bgColor: '#E6EBF5',
    badgeText: 'Co-Parenting',
  },
  {
    id: '3',
    title: 'Health & Reminders',
    description: 'Keep track of clinical records, schedule auto-reminders, and ensure your pet gets the care they need.',
    image: require('../assets/images/onboarding_health.png'),
    accentColor: '#F48024', // Warm orange
    bgColor: '#FFF4EB',
    badgeText: 'Medical Log',
  },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function GetStartedScreen() {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<any>(null);
  
  // Reanimated values
  const scrollX = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useAuthEntryRedirect();

  if (isBootstrapping || isAuthenticated) {
    return <AuthEntryLoader />;
  }

  const updateActiveIndex = (index: number) => {
    setActiveIndex(index);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / width);
      runOnJS(updateActiveIndex)(index);
    },
  });

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    router.push('/auth/login');
  };

  // Button micro-interactions
  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Dynamically interpolate the overall screen background color
  const animatedContainerStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      scrollX.value,
      [0, width, width * 2],
      ['#F0F8F0', '#E6EBF5', '#FFF4EB']
    );
    return {
      backgroundColor: bgColor,
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const activeColors = SLIDES.map((slide) => slide.accentColor);
  const currentSlide = SLIDES[activeIndex] || SLIDES[0];

  return (
    <Animated.View style={[styles.outerContainer, animatedContainerStyle]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Section with Skip Option */}
        <View style={styles.header}>
          {activeIndex < SLIDES.length - 1 ? (
            <TouchableOpacity onPress={handleGetStarted} style={styles.skipButton} activeOpacity={0.7}>
              <AppText variant="bodySmall" weight="700" color={Palette.gray[700]}>
                Skip
              </AppText>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        {/* Reanimated FlatList */}
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={({ item, index }) => (
            <OnboardingSlide slide={item} index={index} scrollX={scrollX} />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={false}
          style={styles.slider}
        />

        {/* Footer controls and indicators */}
        <View style={styles.footer}>
          <OnboardingProgress
            total={SLIDES.length}
            scrollX={scrollX}
            activeColors={activeColors}
          />

          <View style={styles.buttonWrapper}>
            <AnimatedTouchableOpacity
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={activeIndex === SLIDES.length - 1 ? handleGetStarted : handleNext}
              style={[
                styles.actionButton,
                { 
                  backgroundColor: currentSlide.accentColor,
                  shadowColor: currentSlide.accentColor,
                },
                animatedButtonStyle
              ]}
            >
              {/* Spacer on the left to perfectly center the text label */}
              <View style={styles.sideSpacer} />
              
              <AppText variant="body" weight="700" color={Palette.white} style={styles.actionButtonText}>
                {activeIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
              </AppText>
              
              {/* Circular Icon Bubble on the right */}
              <View style={styles.iconBubble}>
                <Ionicons 
                  name={activeIndex === SLIDES.length - 1 ? "checkmark-circle-outline" : "chevron-forward"} 
                  size={20} 
                  color={Palette.white} 
                />
              </View>
            </AnimatedTouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  skipPlaceholder: {
    width: 40,
    height: 20,
  },
  slider: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  actionButton: {
    width: '100%',
    borderRadius: 28, // Premium pill design
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, // Rich soft drop shadow matching slide color
    shadowRadius: 16,
    elevation: 6,
  },
  sideSpacer: {
    width: 36,
    height: 36,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Palette.white,
  },
});
