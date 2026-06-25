import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { AppText } from './AppText';

export type BadgeStatus = 'premium' | 'admin' | 'active' | 'done' | 'skipped' | 'pending';

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  style?: ViewStyle;
}

export function StatusBadge({ status, label, style }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'premium':
        return {
          bg: Colors.premiumBg,
          text: Colors.premiumGold,
          labelText: label || 'PREMIUM',
        };
      case 'admin':
        return {
          bg: '#E0F2FE',
          text: '#0369A1',
          labelText: label || 'ADMIN',
        };
      case 'active':
        return {
          bg: '#ECFDF5',
          text: '#047857',
          labelText: label || 'ACTIVE',
        };
      case 'done':
        return {
          bg: Colors.primaryLight,
          text: Colors.primary,
          labelText: label || 'COMPLETED',
        };
      case 'skipped':
        return {
          bg: '#F5F5F5',
          text: '#757575',
          labelText: label || 'SKIPPED',
        };
      case 'pending':
      default:
        return {
          bg: '#FEF3C7',
          text: '#D97706',
          labelText: label || 'PENDING',
        };
    }
  };

  const config = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <AppText variant="caption" weight="800" color={config.text} style={styles.text}>
        {config.labelText.toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
