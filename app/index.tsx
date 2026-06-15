import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AuthEntryLoader, useAuthEntryRedirect } from '@/components/auth/AuthEntryRedirect';
import { useAuth } from '@/contexts/AuthContext';
import { AppButton } from '../components/ui/AppButton';
import { AppText } from '../components/ui/AppText';
import { Palette, Spacing } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen() {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping } = useAuth();

  useAuthEntryRedirect();

  if (isBootstrapping || isAuthenticated) {
    return <AuthEntryLoader />;
  }

  return (
    <View style={styles.container}>
      {/* Top Image Section */}
      <View style={styles.imageSection}>
        <Image
          source={require('../assets/images/onboarding.png')}
          style={styles.backgroundImage}
          contentFit="cover"
        />
      </View>

      {/* Bottom Card Section */}
      <Animated.View
        entering={FadeInUp.duration(1000).springify()}
        style={styles.card}
      >
        {/* Pagination Indicators */}
        <View style={styles.indicatorContainer}>
          <View style={[styles.indicator, styles.activeIndicator]} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
        </View>

        <View style={styles.content}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <View style={styles.textSection}>
            <AppText variant="h1" align="center" style={styles.title}>
              Hey! Welcome
            </AppText>
            <AppText variant="body" color={Palette.gray[500]} align="center" style={styles.subtitle}>
              never miss a meal, walk or cuddle
            </AppText>
          </View>

          <View style={styles.footer}>
            <AppButton
              title="Get Started"
              onPress={() => router.push('/auth/login')}
              style={styles.startButton}
              textStyle={styles.buttonText}
              icon={<Ionicons name="chevron-forward" size={20} color="white" style={styles.icon} />}
              variant="secondary"
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  imageSection: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    height: height * 0.52,
    width: '100%',
    backgroundColor: Palette.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  indicator: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  activeIndicator: {
    backgroundColor: Palette.success,
    width: 32,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 140,
    height: 100,
    marginBottom: Spacing.md,
  },
  textSection: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#262626',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: Palette.gray[500],
    maxWidth: width * 0.8,
  },
  footer: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    position: 'absolute',
    bottom: height * 0.05,
  },
  startButton: {
    backgroundColor: Palette.success,
    width: '100%',
    borderRadius: 15,
    height: 56,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
  },
  icon: {
    marginLeft: 0,
  },
});
