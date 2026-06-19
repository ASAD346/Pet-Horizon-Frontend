import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthErrorBanner } from '../AuthErrorBanner';
import { AuthTextField } from '../AuthTextField';
import { LoginTheme, Spacing } from '../../../constants/theme';
import type { VerifyEmailFieldErrors } from '../../../services/auth/validation';

interface VerifyEmailFormSectionProps {
  otp: string;
  loading: boolean;
  resendLoading?: boolean;
  formError?: string | null;
  fieldErrors?: VerifyEmailFieldErrors;
  onOtpChange: (text: string) => void;
  onVerify: () => void;
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

export function VerifyEmailFormSection({
  otp,
  loading,
  resendLoading = false,
  formError,
  fieldErrors,
  onOtpChange,
  onVerify,
  onResendCode,
  onLogin,
}: VerifyEmailFormSectionProps) {
  const busy = loading || resendLoading;

  return (
    <View style={styles.container}>
      <AppText variant="h3" color={LoginTheme.charcoal} weight="700" style={styles.title}>
        Verify your email
      </AppText>
      <AppText variant="bodySmall" color={LoginTheme.tagline} style={styles.subtitle}>
        Enter the 6-digit code we sent to your email.
      </AppText>

      {formError ? <AuthErrorBanner message={formError} /> : null}

      <AuthTextField
        placeholder="Verification code"
        icon="keypad-outline"
        value={otp}
        onChangeText={onOtpChange}
        keyboardType="number-pad"
        compact
        error={fieldErrors?.otp}
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.resendRow}
        onPress={onResendCode}
        disabled={busy}
      >
        <AppText variant="bodySmall" color={LoginTheme.green} weight="600">
          {resendLoading ? 'Sending code…' : 'Resend code'}
        </AppText>
      </TouchableOpacity>

      <AppButton
        title="Verify Email"
        onPress={onVerify}
        loading={loading}
        disabled={busy}
        variant="success"
        size="sm"
        style={styles.verifyButton}
        textStyle={styles.verifyButtonText}
      />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color={LoginTheme.tagline}>
          Already verified?{' '}
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
  verifyButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: LoginTheme.green,
    paddingVertical: 12,
    marginTop: Spacing.xs,
    ...buttonShadow,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
});
