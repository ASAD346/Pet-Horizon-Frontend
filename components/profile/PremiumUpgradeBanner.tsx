import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

interface PremiumUpgradeBannerProps {
  onUpgradePress: () => void;
}

export function PremiumUpgradeBanner({ onUpgradePress }: PremiumUpgradeBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="diamond" size={22} color="#F0C419" />
      </View>
      <View style={styles.textBlock}>
        <AppText variant="body" weight="800" color="#FFFFFF">
          Unlock Full Potential
        </AppText>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.85)" style={styles.subtitle}>
          Experience Pet Horizon without limits.
        </AppText>
      </View>
      <AppButton
        title="Upgrade Now"
        onPress={onUpgradePress}
        variant="ghost"
        size="sm"
        style={styles.btn}
        textStyle={styles.btnText}
      />
    </View>
  );
}

const bannerShadow = Platform.select({
  ios: {
    shadowColor: ProfileTheme.purpleDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
});

const styles = StyleSheet.create({
  banner: {
    backgroundColor: ProfileTheme.premiumGradientStart,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...bannerShadow,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  textBlock: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    marginTop: 4,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
  },
  btnText: {
    color: ProfileTheme.purple,
    fontWeight: '700',
  },
});
