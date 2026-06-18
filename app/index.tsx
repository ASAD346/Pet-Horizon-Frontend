import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AuthEntryLoader, useAuthEntryRedirect } from '@/components/auth/AuthEntryRedirect';
import { AuthLogoMark } from '@/components/auth/AuthLogoMark';
import { useAuth } from '@/contexts/AuthContext';
import { AppButton } from '../components/ui/AppButton';
import { AppText } from '../components/ui/AppText';
import { HomeTheme, Palette, Spacing } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const HIGHLIGHTS = [
  { icon: 'calendar-outline' as const, label: 'Care schedules' },
  { icon: 'people-outline' as const, label: 'Family sharing' },
  { icon: 'heart-outline' as const, label: 'Happy pets' },
];

export default function GetStartedScreen() {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping } = useAuth();

  useAuthEntryRedirect();

  if (isBootstrapping || isAuthenticated) {
    return <AuthEntryLoader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageSection}>
        <Image
          source={require('../assets/images/onboarding.png')}
          style={styles.backgroundImage}
          contentFit="cover"
        />
        <View style={styles.imageOverlay} />
      </View>

      <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.card}>
        <View style={styles.content}>
          <AuthLogoMark style={styles.logoMark} />

          <View style={styles.textSection}>
            <AppText variant="h1" align="center" style={styles.title}>
              Hey! Welcome
            </AppText>
            <AppText variant="body" color={Palette.gray[500]} align="center" style={styles.subtitle}>
              Never miss a meal, walk, or cuddle
            </AppText>
          </View>

          <View style={styles.highlightsRow}>
            {HIGHLIGHTS.map((item) => (
              <View key={item.label} style={styles.highlightChip}>
                <Ionicons name={item.icon} size={16} color={HomeTheme.cardGreen} />
                <AppText variant="caption" weight="600" color={HomeTheme.text} style={styles.chipLabel}>
                  {item.label}
                </AppText>
              </View>
            ))}
          </View>

          <AppButton
            title="Get Started"
            onPress={() => router.push('/auth/login')}
            style={styles.startButton}
            textStyle={styles.buttonText}
            icon={<Ionicons name="chevron-forward" size={20} color="white" />}
            variant="secondary"
          />
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
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    minHeight: height * 0.5,
    width: '100%',
    backgroundColor: Palette.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  logoMark: {
    marginBottom: Spacing.xs,
  },
  textSection: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#262626',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: Palette.gray[500],
    maxWidth: width * 0.82,
  },
  highlightsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F8F0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipLabel: {
    fontSize: 11,
  },
  startButton: {
    backgroundColor: HomeTheme.cardGreen,
    width: '100%',
    borderRadius: 14,
    minHeight: 54,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
