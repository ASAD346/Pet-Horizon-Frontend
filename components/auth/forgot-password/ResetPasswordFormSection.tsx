import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthTextField } from '../AuthTextField';
import { Palette, Spacing } from '../../../constants/theme';
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

export function ResetPasswordFormSection({
  email,
  otp,
  newPassword,
  confirmPassword,
  loading,
  resendLoading = false,
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
      <AppText variant="h3" color="#1A2B4E" weight="800" style={styles.title}>
        Reset password
      </AppText>
      <AppText variant="bodySmall" color={Palette.gray[500]} style={styles.subtitle} weight="600">
        Enter the 6-digit code from your email and choose a new password.
      </AppText>

      <AuthTextField
        placeholder="Email Address"
        icon="mail-outline"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        compact={false}
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
        compact={false}
        error={fieldErrors?.otp}
        maxLength={6}
      />

      <AuthTextField
        placeholder="New Password"
        icon="lock-closed-outline"
        value={newPassword}
        onChangeText={onNewPasswordChange}
        secureTextEntry
        showPasswordToggle={true}
        compact={false}
        error={fieldErrors?.newPassword}
      />

      <AuthTextField
        placeholder="Confirm New Password"
        icon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        secureTextEntry
        showPasswordToggle={true}
        compact={false}
        error={fieldErrors?.confirmPassword}
      />

      <TouchableOpacity
        style={styles.resendRow}
        onPress={onResendCode}
        disabled={busy || !email.trim()}
      >
        <AppText variant="bodySmall" color="#5CB35D" weight="700">
          {resendLoading ? 'Sending code…' : 'Resend code'}
        </AppText>
      </TouchableOpacity>

      <AppButton
        title="Reset Password"
        onPress={onResetPassword}
        loading={loading}
        disabled={busy}
        style={styles.submitButton}
        textStyle={styles.submitButtonText}
      />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color={Palette.gray[500]} weight="600">
          Back to{' '}
        </AppText>
        <TouchableOpacity onPress={onLogin} disabled={busy}>
          <AppText variant="bodySmall" color="#5CB35D" weight="800">
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
    height: 52,
    borderRadius: 14,
    backgroundColor: '#5CB35D',
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 0,
    marginTop: Spacing.xs,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.5,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});
