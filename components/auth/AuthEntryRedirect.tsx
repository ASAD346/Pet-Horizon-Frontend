import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform, Image } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

import { useAuth } from '@/hooks/useAuth';
import { HomeTheme, Spacing, Radius } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

/**
 * Restores the user to the right screen after a cold start when a session exists.
 */
export function useAuthEntryRedirect(enabled = true) {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  useEffect(() => {
    if (!enabled || isBootstrapping || !isAuthenticated) return;

    const target: Href = user?.activePetId ? '/(tabs)' : '/pet/register';
    router.replace(target);
  }, [enabled, isAuthenticated, isBootstrapping, router, user?.activePetId]);
}

export function AuthEntryLoader() {
  const insets = useSafeAreaInsets();
  
  // Animation hooks for breathing logo
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0.75)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  // Pulse halo animation values
  const haloScale1 = useRef(new Animated.Value(1)).current;
  const haloOpacity1 = useRef(new Animated.Value(0.4)).current;
  const haloScale2 = useRef(new Animated.Value(1)).current;
  const haloOpacity2 = useRef(new Animated.Value(0.4)).current;

  // Progress loader animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  const appVersion = Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? '1.0.0';
  const buildVersion = Constants.expoConfig?.android?.versionCode?.toString() ?? Application.nativeBuildVersion ?? '1';

  useEffect(() => {
    // Breathing logo scale and opacity loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1.04,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1.0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 0.92,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0.75,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Pulse halo 1 loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale1, {
            toValue: 1.8,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity1, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(haloScale1, {
            toValue: 1.0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity1, {
            toValue: 0.4,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Pulse halo 2 loop with offset delay
    let halo2Timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(haloScale2, {
              toValue: 1.8,
              duration: 2400,
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity2, {
              toValue: 0,
              duration: 2400,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(haloScale2, {
              toValue: 1.0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity2, {
              toValue: 0.4,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, 1200);

    // Indeterminate progress loading bar
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      })
    ).start();

    // Fade in text contents
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return () => clearTimeout(halo2Timer);
  }, [logoScale, logoOpacity, haloScale1, haloOpacity1, haloScale2, haloOpacity2, progressAnim, contentFade]);

  // Interpolate progress translateX
  const progressTranslateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  return (
    <LinearGradient
      colors={['#103F23', '#1B5B34'] as const}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative background rings */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.bgRing1} />
        <View style={styles.bgRing2} />
      </View>

      {/* Glassmorphic Central Branding Card */}
      <Animated.View style={[styles.glassCard, { opacity: contentFade }]}>
        <View style={styles.logoContainer}>
          {/* Pulsing halos behind the logo */}
          <Animated.View
            style={[
              styles.haloRing,
              {
                transform: [{ scale: haloScale1 }],
                opacity: haloOpacity1,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.haloRing,
              {
                transform: [{ scale: haloScale2 }],
                opacity: haloOpacity2,
              },
            ]}
          />

          {/* Main Breathing Logo Ring */}
          <Animated.View
            style={[
              styles.logoRing,
              {
                transform: [{ scale: logoScale }],
                opacity: logoOpacity,
              },
            ]}
          >
            <View style={styles.logoInner}>
              <Image
                source={require('../../assets/images/applogo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
        </View>

        <View style={styles.textWrap}>
          <AppText variant="h1" weight="800" color="#FFFFFF" style={styles.brandTitle}>
            Pet Horizon
          </AppText>
          <AppText variant="bodySmall" weight="700" color="rgba(255,255,255,0.7)" style={styles.brandSubtitle}>
            WHERE EVERY PAW FINDS ITS PATH
          </AppText>
        </View>
      </Animated.View>

      {/* Modern Horizontal Loader & Version Indicator at the bottom */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <Animated.View style={[styles.loaderTrack, { opacity: contentFade }]}>
          <Animated.View
            style={[
              styles.loaderBar,
              {
                transform: [{ translateX: progressTranslateX }],
              },
            ]}
          />
        </Animated.View>
        <AppText variant="caption" weight="800" color="rgba(255,255,255,0.4)" style={styles.versionLabel}>
          v{appVersion} ({buildVersion})
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgRing1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: '10%',
    left: -80,
  },
  bgRing2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    bottom: '15%',
    right: -60,
  },
  glassCard: {
    paddingVertical: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.xl * 1.5,
    borderRadius: Radius.lg * 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    width: '80%',
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  textWrap: {
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    letterSpacing: 2.0,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loaderTrack: {
    width: 100,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  loaderBar: {
    width: 40,
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  versionLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
