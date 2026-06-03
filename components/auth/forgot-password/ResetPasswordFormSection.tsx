import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthErrorBanner } from '../AuthErrorBanner';
import { AuthInfoBanner } from '../AuthInfoBanner';
import { AuthTextField } from '../AuthTextField';
import { LoginTheme, Spacing } from '../../../constants/theme';
import type { ResetPasswordFieldErrors } from '../../../services/auth/validation';

interface ResetPasswordFormSectionProps {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  resendLoading?: boolean;
  formError?: string | null;
  formInfo?: string | null;
  fieldErrors?: ResetPasswordFieldErrors;
  onEmailChange: (text: string) => void;
  onOtpChange: (text: string) => void;
  onNewPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  onResetPassword: () => void;
  onResendCode: () => void;
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

export function ResetPasswordFormSection({
  email,
  otp,
  newPassword,
  confirmPassword,
  loading,
  resendLoading = false,
  formError,
  formInfo,
  fieldErrors,
  onEmailChange,
  onOtpChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onResetPassword,
  onResendCode,
  onLogin,
}: ResetPasswordFormSectionProps) {
  const busy = loading || resendLoading;

  return (
    <View style={styles.container}>
      <AppText variant="h3" color={LoginTheme.charcoal} weight="700" style={styles.title}>
        Reset password
      </AppText>
      <AppText variant="bodySmall" color={LoginTheme.tagline} style={styles.subtitle}>
        Enter the 6-digit code from your email and choose a new password.
      </AppText>

      {formInfo ? <AuthInfoBanner message={formInfo} /> : null}
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
        editable={!email.trim()}
      />

      <AuthTextField
        placeholder="Reset code"
        icon="keypad-outline"
        value={otp}
        onChangeText={onOtpChange}
        keyboardType="number-pad"
        compact
        error={fieldErrors?.otp}
        maxLength={6}
      />

      <AuthTextField
        placeholder="New Password"
        icon="lock-closed-outline"
        value={newPassword}
        onChangeText={onNewPasswordChange}
        secureTextEntry
        compact
        error={fieldErrors?.newPassword}
      />

      <AuthTextField
        placeholder="Confirm New Password"
        icon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        secureTextEntry
        compact
        error={fieldErrors?.confirmPassword}
      />

      <TouchableOpacity
        style={styles.resendRow}
        onPress={onResendCode}
        disabled={busy || !email.trim()}
      >
        <AppText variant="bodySmall" color={LoginTheme.green} weight="600">
          {resendLoading ? 'Sending code…' : 'Resend code'}
        </AppText>
      </TouchableOpacity>

      <AppButton
        title="Reset Password"
        onPress={onResetPassword}
        loading={loading}
        disabled={busy}
        variant="success"
        size="sm"
        style={styles.submitButton}
        textStyle={styles.submitButtonText}
      />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color={LoginTheme.tagline}>
          Back to{' '}
        </AppText>
        <TouchableOpacity onPress={onLogin} disabled={busy}>
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
  resendRow: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
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
