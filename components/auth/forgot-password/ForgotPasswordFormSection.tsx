import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthErrorBanner } from '../AuthErrorBanner';
import { AuthTextField } from '../AuthTextField';
import { LoginTheme, Spacing } from '../../../constants/theme';
import type { ForgotPasswordFieldErrors } from '../../../services/auth/validation';

interface ForgotPasswordFormSectionProps {
  email: string;
  loading: boolean;
  formError?: string | null;
  fieldErrors?: ForgotPasswordFieldErrors;
  onEmailChange: (text: string) => void;
  onSendCode: () => void;
  onLogin: () => void;
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
});

export function ForgotPasswordFormSection({
  email,
  loading,
  formError,
  fieldErrors,
  onEmailChange,
  onSendCode,
  onLogin,
}: ForgotPasswordFormSectionProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" color={LoginTheme.charcoal} weight="700" style={styles.title}>
        Forgot password
      </AppText>
      <AppText variant="bodySmall" color={LoginTheme.tagline} style={styles.subtitle}>
        Enter your email and we&apos;ll send you a 6-digit reset code.
      </AppText>

      {formError ? <AuthErrorBanner message={formError} /> : null}

      <AuthTextField
        placeholder="Email Address"
        icon="mail-outline"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        compact
        error={fieldErrors?.email}
        autoCapitalize="none"
      />

      <AppButton
        title="Send Reset Code"
        onPress={onSendCode}
        loading={loading}
        disabled={loading}
        variant="success"
        size="sm"
        style={styles.submitButton}
        textStyle={styles.submitButtonText}
      />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color={LoginTheme.tagline}>
          Remember your password?{' '}
        </AppText>
        <TouchableOpacity onPress={onLogin} disabled={loading}>
          <AppText variant="bodySmall" color={LoginTheme.green} weight="700">
            Login
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  submitButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: LoginTheme.green,
    paddingVertical: 12,
    marginTop: Spacing.xs,
    ...buttonShadow,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
});
