import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { AppText } from './AppText';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  /** Legacy prop support — use buttonLabel instead */
  actionLabel?: string;
  onActionPress?: () => void;
  buttonLabel?: string;
  onButtonPress?: () => void;
  buttonVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  /** Compact mode for inline usage */
  compact?: boolean;
}

const VARIANT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: '#1E5838', text: '#FFFFFF', border: '#1E5838' },
  success: { bg: '#1E5838', text: '#FFFFFF', border: '#1E5838' },
  secondary: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
  danger: { bg: '#DC2626', text: '#FFFFFF', border: '#DC2626' },
  outline: { bg: 'transparent', text: '#1E5838', border: '#1E5838' },
  ghost: { bg: 'transparent', text: '#64748B', border: 'transparent' },
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
  buttonLabel,
  onButtonPress,
  buttonVariant = 'success',
  compact = false,
}: EmptyStateProps) {
  const resolvedLabel = buttonLabel ?? actionLabel;
  const resolvedPress = onButtonPress ?? onActionPress;
  const variantStyle = VARIANT_COLORS[buttonVariant] ?? VARIANT_COLORS.success;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Icon with gradient background */}
      <LinearGradient
        colors={['#E8F5ED', '#F0FAF4']}
        style={styles.iconCircle}
      >
        <MaterialCommunityIcons name={icon} size={32} color="#1E5838" />
      </LinearGradient>

      <AppText variant="h3" weight="700" color={Colors.text} style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodySmall" color={Colors.textMuted} align="center" style={styles.description}>
        {description}
      </AppText>

      {resolvedLabel && resolvedPress ? (
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: variantStyle.bg,
              borderColor: variantStyle.border,
              borderWidth: variantStyle.bg === 'transparent' ? 1.5 : 0,
            },
          ]}
          onPress={resolvedPress}
          activeOpacity={0.85}
        >
          <AppText
            variant="bodySmall"
            weight="700"
            color={variantStyle.text}
            style={styles.buttonText}
          >
            {resolvedLabel}
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: 'transparent',
  },
  containerCompact: {
    padding: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(30,88,56,0.12)',
    ...Platform.select({
      ios: { shadowColor: '#1E5838', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontSize: 17,
  },
  description: {
    lineHeight: 20,
    marginBottom: Spacing.md,
    maxWidth: 270,
    fontSize: 13,
  },
  button: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.full,
    minWidth: 160,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#1E5838', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  buttonText: {
    fontSize: 14,
  },
});
