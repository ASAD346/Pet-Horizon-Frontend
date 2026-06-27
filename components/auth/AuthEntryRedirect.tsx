import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';

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
    const timer = setTimeout(() => {
      router.replace(target);
    }, 1500); // 1.5s delay to let the beautiful animated splash screen be appreciated
    return () => clearTimeout(timer);
  }, [enabled, isAuthenticated, isBootstrapping, router, user?.activePetId]);
}

export function AuthEntryLoader() {
  const insets = useSafeAreaInsets();
  
  // Animation hooks for breathing logo
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0.6)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  const appVersion = Application.nativeApplicationVersion ?? '1.0.0';
  const buildVersion = Application.nativeBuildVersion ?? '1';

  useEffect(() => {
    // Breathing logo scale and opacity loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1.0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 0.9,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Fade in text contents
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [logoScale, logoOpacity, contentFade]);

  return (
    <LinearGradient
      colors={['#184F2E', '#267343'] as const}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative background rings */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.bgRing1} />
        <View style={styles.bgRing2} />
      </View>

      {/* Main branded content */}
      <View style={styles.contentWrap}>
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
            <MaterialCommunityIcons name="paw" size={44} color="#184F2E" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textWrap, { opacity: contentFade }]}>
          <AppText variant="h1" weight="800" color="#FFFFFF" style={styles.brandTitle}>
            Pet Horizon
          </AppText>
          <AppText variant="bodySmall" weight="700" color="rgba(255,255,255,0.75)" style={styles.brandSubtitle}>
            Where every paw finds its path
          </AppText>
        </Animated.View>
      </View>

      {/* Modern Loader & Version Indicator at the bottom */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <Animated.View style={[styles.loaderBar, { opacity: contentFade }]} />
        <AppText variant="caption" weight="800" color="rgba(255,255,255,0.5)" style={styles.versionLabel}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    top: '15%',
    left: -80,
  },
  bgRing2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    bottom: '20%',
    right: -60,
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 32,
    lineHeight: 38,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loaderBar: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  versionLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
