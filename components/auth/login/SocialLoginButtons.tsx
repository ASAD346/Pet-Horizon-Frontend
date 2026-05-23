import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { AppButton } from '../../ui/AppButton';
import { OrDivider } from '../OrDivider';
import { LoginTheme, Spacing } from '../../../constants/theme';

interface SocialLoginButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  compact?: boolean;
}

const buttonShadow = Platform.select({
  ios: {
    shadowColor: LoginTheme.buttonShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  android: {
    elevation: 6,
  },
  default: {},
});

export function SocialLoginButtons({ onGooglePress, onApplePress, compact = false }: SocialLoginButtonsProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <OrDivider compact={compact} />

      <AppButton
        title="Login With Google"
        onPress={onGooglePress}
        variant="success"
        size="sm"
        style={[styles.socialButton, compact && styles.socialButtonCompact]}
        textStyle={styles.socialButtonText}
        icon={<AntDesign name="google" size={18} color="#FFFFFF" />}
      />

      <AppButton
        title="Login With Apple"
        onPress={onApplePress}
        variant="success"
        size="sm"
        style={[styles.appleButton, compact && styles.socialButtonCompact]}
        textStyle={styles.socialButtonText}
        icon={<AntDesign name="apple" size={18} color="#121212" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  containerCompact: {
    marginBottom: Spacing.xs,
  },
  socialButtonCompact: {
    minHeight: 42,
    paddingVertical: 10,
    marginBottom: Spacing.sm,
  },
  socialButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: LoginTheme.green,
    marginBottom: Spacing.md,
    paddingVertical: 12,
    ...buttonShadow,
  },
  appleButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: LoginTheme.green,
    marginBottom: 0,
    paddingVertical: 12,
    ...buttonShadow,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
