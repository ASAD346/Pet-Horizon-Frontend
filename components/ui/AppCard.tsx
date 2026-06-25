import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';

interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat' | 'outlined';
}

export function AppCard({ children, variant = 'flat', style, ...props }: AppCardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return [styles.card, styles.elevated];
      case 'outlined':
        return [styles.card, styles.outlined];
      case 'flat':
      default:
        return [styles.card, styles.flat];
    }
  };

  return (
    <View style={[getVariantStyle(), style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  flat: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  elevated: {
    ...Shadows.sm,
  },
});
