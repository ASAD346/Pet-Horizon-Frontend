import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';

interface PremiumUpgradeBannerProps {
  onUpgradePress: () => void;
}

export function PremiumUpgradeBanner({ onUpgradePress }: PremiumUpgradeBannerProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#071F11', '#0E3B21']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.contentCol}>
          <View style={styles.badge}>
            <Ionicons name="star" size={8} color="#D4A017" />
            <AppText variant="caption" weight="800" color="#D4A017" style={styles.badgeText}>
              PREMIUM
            </AppText>
          </View>
          
          <AppText variant="body" weight="800" color="#FFFFFF" style={styles.headline}>
            Give Your Pets the Best Care
          </AppText>
          
          <AppText variant="caption" color="rgba(255, 255, 255, 0.65)" style={styles.description}>
            Includes unlimited pets, family sharing, and smart reminders.
          </AppText>
        </View>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={onUpgradePress}
          activeOpacity={0.85}
        >
          <AppText variant="caption" weight="800" color="#0E3B21" style={styles.ctaText}>
            Upgrade
          </AppText>
          <Ionicons name="arrow-forward" size={11} color="#0E3B21" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const bannerShadow = Platform.select({
  ios: {
    shadowColor: '#071F11',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    ...bannerShadow,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.xl,
    padding: Spacing.lg - 2,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    gap: Spacing.md,
  },
  contentCol: {
    flex: 1,
    gap: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  headline: {
    fontSize: 16,
    lineHeight: 21,
  },
  description: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
  },
  ctaText: {
    fontSize: 11.5,
  },
});





