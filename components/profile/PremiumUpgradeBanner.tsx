import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

interface PremiumUpgradeBannerProps {
  onUpgradePress: () => void;
}

const HIGHLIGHTS = [
  { icon: 'paw' as const, label: 'Unlimited Pets' },
  { icon: 'analytics' as const, label: 'Health Insights' },
  { icon: 'people' as const, label: 'Family Sharing' },
];

export function PremiumUpgradeBanner({ onUpgradePress }: PremiumUpgradeBannerProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[ProfileTheme.premiumGradientStart, ProfileTheme.premiumGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        {/* Decorative bg rings */}
        <View style={styles.bgRing1} />
        <View style={styles.bgRing2} />

        {/* Header row: crown icon + badge */}
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="crown" size={20} color="#D4A017" />
          </View>
          <View style={styles.goldPill}>
            <Ionicons name="sparkles" size={9} color="#D4A017" />
            <AppText variant="caption" weight="800" color="#D4A017" style={styles.goldPillText}>
              PET HORIZON PREMIUM
            </AppText>
          </View>
        </View>

        {/* Headline & description */}
        <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.headline}>
          Give Your Pets the Best Care
        </AppText>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.82)" style={styles.description}>
          Unlock unlimited tracking, advanced health insights, family collaboration, and powerful tools designed for dedicated pet parents.
        </AppText>

        {/* Feature highlights */}
        <View style={styles.highlightsRow}>
          {HIGHLIGHTS.map((item) => (
            <View key={item.label} style={styles.highlightChip}>
              <Ionicons name={item.icon} size={12} color="rgba(255,255,255,0.9)" />
              <AppText variant="caption" weight="700" color="rgba(255,255,255,0.9)" style={styles.highlightLabel}>
                {item.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={onUpgradePress}
          activeOpacity={0.88}
        >
          <AppText variant="bodySmall" weight="800" color={ProfileTheme.premiumGoldDark} style={styles.ctaText}>
            Upgrade to Premium
          </AppText>
          <Ionicons name="arrow-forward" size={14} color={ProfileTheme.premiumGoldDark} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const bannerShadow = Platform.select({
  ios: {
    shadowColor: ProfileTheme.premiumGoldDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  android: { elevation: 6 },
});

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    ...bannerShadow,
  },
  banner: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(212,160,23,0.4)',
    overflow: 'hidden',
  },
  bgRing1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -40,
  },
  bgRing2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212,160,23,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212,160,23,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
  },
  goldPillText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  headline: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
  description: {
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  highlightLabel: {
    fontSize: 10,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  ctaText: {
    fontSize: 13,
  },
});
