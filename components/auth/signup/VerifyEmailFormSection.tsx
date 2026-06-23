import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthTextField } from '../AuthTextField';
import { Palette, Spacing } from '../../../constants/theme';
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

export function VerifyEmailFormSection({
  otp,
  loading,
  resendLoading = false,
  fieldErrors,
  onOtpChange,
  onVerify,
  onResendCode,
  onLogin,
}: VerifyEmailFormSectionProps) {
  const busy = loading || resendLoading;

  return (
    <View style={styles.container}>
      <AppText variant="h3" color="#1A2B4E" weight="800" style={styles.title}>
        Verify your email
      </AppText>
      <AppText variant="bodySmall" color={Palette.gray[500]} style={styles.subtitle} weight="600">
        Enter the 6-digit code we sent to your email.
      </AppText>

      <AuthTextField
        placeholder="Verification code"
        icon="keypad-outline"
        value={otp}
        onChangeText={onOtpChange}
        keyboardType="number-pad"
        compact={false}
        error={fieldErrors?.otp}
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.resendRow}
        onPress={onResendCode}
        disabled={busy}
      >
        <AppText variant="bodySmall" color="#5CB35D" weight="700">
          {resendLoading ? 'Sending code…' : 'Resend code'}
        </AppText>
      </TouchableOpacity>

      <AppButton
        title="Verify Email"
        onPress={onVerify}
        loading={loading}
        disabled={busy}
        style={styles.verifyButton}
        textStyle={styles.verifyButtonText}
      />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color={Palette.gray[500]} weight="600">
          Already verified?{' '}
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
  verifyButton: {
    width: '100%',
    height: 52,
    borderRadius: 14, // Consistent modern rounded corners
    backgroundColor: '#5CB35D',
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 0,
    marginTop: Spacing.xs,
  },
  verifyButtonText: {
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
