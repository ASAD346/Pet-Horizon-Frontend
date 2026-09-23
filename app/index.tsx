import React, { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions, StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useAuthEntryRedirect } from '@/components/auth/AuthEntryRedirect';
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
  runOnJS,
  withSpring
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES: SlideData[] = [
  {
    id: '1',
    title: 'Smart Feeding & Nutrition',
    description: 'Track daily meals, monitor feeding portions, and set timely reminders so your pet always stays nourished and healthy.',
    image: require('../assets/images/onboarding_slide1.jpg'),
    accentColor: '#5CB35D', // Emerald Green
    bgColor: '#111A13',
    badgeText: 'Daily Meals & Nutrition',
  },
  {
    id: '2',
    title: 'Active Play & Daily Routine',
    description: 'Log daily playtime, walks, training moments, and vet activities to nurture a joyful and energetic companion.',
    image: require('../assets/images/onboarding_slide2.jpg'),
    accentColor: '#4C84FF', // Electric Blue
    bgColor: '#101625',
    badgeText: 'Play & Activity Tracking',
  },
  {
    id: '3',
    title: 'Co-Parent with Family',
    description: 'Invite family members, partners, or sitters to care for your pets together in real-time without missing a heartbeat.',
    image: require('../assets/images/onboarding_slide3.png'),
    accentColor: '#FF9233', // Vibrant Warm Orange
    bgColor: '#20150F',
    badgeText: 'Family & Co-Parenting',
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

  // Temporarily bypassed redirects so you can work directly on the onboarding screen
  // useAuthEntryRedirect();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / width);
      runOnJS(setActiveIndex)(index);
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

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('HAS_SEEN_ONBOARDING', 'true');
    } catch (e) {
      console.warn('Failed to save HAS_SEEN_ONBOARDING', e);
    }
    router.replace('/auth/login');
  };

  // Button micro-interactions
  const handlePressIn = () => {
    buttonScale.value = withSpring(0.92);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const activeColors = SLIDES.map((slide) => slide.accentColor);
  const currentSlide = SLIDES[activeIndex] || SLIDES[0];
  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.outerContainer}>
      {/* Reanimated Full-Screen Slider */}
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

      {/* Floating Bottom Navigation Bar */}
      <SafeAreaView style={styles.floatingBottomBar} pointerEvents="box-none">
        <View style={styles.navRow}>
          {/* Left: Skip Button */}
          <View style={styles.sideItem}>
            {!isLastSlide ? (
              <TouchableOpacity
                onPress={handleGetStarted}
                activeOpacity={0.7}
                style={styles.skipButton}
              >
                <AppText variant="body" weight="700" color="rgba(255, 255, 255, 0.72)">
                  Skip
                </AppText>
              </TouchableOpacity>
            ) : (
              <View style={styles.sideSpacer} />
            )}
          </View>

          {/* Center: Pagination Dots */}
          <View style={styles.centerItem}>
            <OnboardingProgress
              total={SLIDES.length}
              scrollX={scrollX}
              activeColors={activeColors}
            />
          </View>

          {/* Right: Next / Get Started Action Button */}
          <View style={styles.sideItemRight}>
            <AnimatedTouchableOpacity
              activeOpacity={0.85}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleNext}
              style={[
                isLastSlide ? styles.getStartedButton : styles.circularNextButton,
                {
                  backgroundColor: currentSlide.accentColor,
                  shadowColor: currentSlide.accentColor,
                },
                animatedButtonStyle,
              ]}
            >
              {isLastSlide ? (
                <View style={styles.getStartedContent}>
                  <AppText variant="body" weight="800" color={Palette.white} style={styles.getStartedText}>
                    Start
                  </AppText>
                  <Ionicons name="arrow-forward" size={18} color={Palette.white} />
                </View>
              ) : (
                <Ionicons name="arrow-forward" size={22} color={Palette.white} />
              )}
            </AnimatedTouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  slider: {
    flex: 1,
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sideItem: {
    minWidth: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideItemRight: {
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  centerItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  sideSpacer: {
    width: 60,
    height: 52,
  },
  circularNextButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedButton: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  getStartedText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
});


