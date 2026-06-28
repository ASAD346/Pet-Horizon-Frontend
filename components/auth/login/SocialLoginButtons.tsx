import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { AppButton } from '../../ui/AppButton'; // Social buttons keep brand-specific styles
import { OrDivider } from '../OrDivider';
import { Spacing, Palette } from '../../../constants/theme';

interface SocialLoginButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  compact?: boolean;
  googleLoading?: boolean;
  googleLabel?: string;
  googleDisabled?: boolean;
}

export function SocialLoginButtons({
  onGooglePress,
  onApplePress,
  compact = false,
  googleLoading = false,
  googleLabel = 'Continue with Google',
  googleDisabled = false,
}: SocialLoginButtonsProps) {
  return (
    <View style={styles.container}>
      <OrDivider compact={compact} />

      <AppButton
        title={googleLabel}
        onPress={onGooglePress}
        loading={googleLoading}
        disabled={googleLoading || googleDisabled}
        style={styles.googleButton}
        textStyle={styles.googleButtonText}
        icon={<AntDesign name="google" size={18} color="#EA4335" />}
      />

      {Platform.OS === 'ios' ? (
        <AppButton
          title="Continue with Apple"
          onPress={onApplePress}
          style={styles.appleButton}
          textStyle={styles.appleButtonText}
          icon={<AntDesign name="apple" size={18} color={Palette.white} />}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  googleButton: {
    width: '100%',
    height: 52,
    borderRadius: 14, // Consistent modern rounded corners
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    marginBottom: Spacing.md,
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262626',
  },
  appleButton: {
    width: '100%',
    height: 52,
    borderRadius: 14, // Consistent modern rounded corners
    backgroundColor: '#1E1E1E',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.white,
  },
});
