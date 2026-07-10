import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { CustomButton } from '../../ui/AppButton';
import { OtpInput } from '../../shared/OtpInput';
import { Palette, Spacing, Radius } from '../../../constants/theme';
import type { VerifyEmailFieldErrors } from '../../../services/auth/validation';

interface VerifyEmailFormSectionProps {
  email: string;
  otp: string;
  loading: boolean;
  resendLoading?: boolean;
  fieldErrors?: VerifyEmailFieldErrors;
  onOtpChange: (text: string) => void;
  onVerify: () => void;
  onResendCode: () => void;
  onBack?: () => void;
}

export function VerifyEmailFormSection({
  email,
  otp,
  loading,
  resendLoading = false,
  fieldErrors,
  onOtpChange,
  onVerify,
  onResendCode,
  onBack,
}: VerifyEmailFormSectionProps) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    if (countdown > 0 || resendLoading) return;
    onResendCode();
    setCountdown(60);
  };

  const busy = loading || resendLoading;
  const isOtpComplete = otp.length === 6;

  return (
    <View style={styles.container}>

      <AppText variant="h3" color="#1A2B4E" weight="800" style={styles.title}>
        Verify your email
      </AppText>

      <View style={styles.subtitleContainer}>
        <AppText variant="bodySmall" color={Palette.gray[500]} weight="700">
          We sent a 6-digit OTP to{' '}
          <AppText variant="bodySmall" color="#1A2B4E" weight="800">
            {email}
          </AppText>
        </AppText>
      </View>

      {/* 6 digit OTP Input component */}
      <OtpInput
        value={otp}
        onChange={onOtpChange}
        error={fieldErrors?.otp}
      />

      {fieldErrors?.otp ? (
        <AppText variant="caption" color={Palette.error} style={styles.errorText}>
          {fieldErrors.otp}
        </AppText>
      ) : null}

      {/* Verify & Continue Button */}
      <CustomButton
        title="Verify & Continue"
        onPress={onVerify}
        isLoading={loading}
        disabled={busy || !isOtpComplete}
        style={styles.verifyButton}
      />

      {/* Resend option */}
      <View style={styles.resendContainer}>
        {countdown > 0 ? (
          <AppText variant="bodySmall" color={Palette.gray[500]} weight="700">
            Didn't receive the code?{' '}
            <AppText variant="bodySmall" color={Palette.gray[400]} weight="700">
              Resend in {countdown}s
            </AppText>
          </AppText>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
            <AppText variant="bodySmall" color="#5CB35D" weight="800">
              {resendLoading ? 'Resending code…' : 'Resend code'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Shield/Lock helper text at the bottom */}
      <View style={styles.footerContainer}>
        <Ionicons name="shield-checkmark-outline" size={16} color={Palette.gray[500]} style={styles.footerIcon} />
        <AppText variant="caption" color={Palette.gray[500]} weight="700">
          OTP is valid for 10 minutes only
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: Spacing.xs,
  },
  subtitleContainer: {
    marginBottom: Spacing.sm,
  },
  errorText: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  verifyButton: {
    marginTop: Spacing.xs,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  footerIcon: {
    marginRight: 2,
  },
});
