import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../../ui/AppText';
import { CustomButton } from '../../ui/AppButton';
import { AuthTextField } from '../AuthTextField';
import { Palette, Spacing } from '../../../constants/theme';
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

export function ForgotPasswordFormSection({
  email,
  loading,
  fieldErrors,
  onEmailChange,
  onSendCode,
  onLogin,
}: ForgotPasswordFormSectionProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" color="#1A2B4E" weight="800" style={styles.title}>
        Forgot password
      </AppText>
      <AppText variant="bodySmall" color={Palette.gray[500]} style={styles.subtitle} weight="600">
        Enter your email and we&apos;ll send you a 6-digit reset code.
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
      />

      <CustomButton
        title="Send Reset Code"
        onPress={onSendCode}
        isLoading={loading}
        disabled={loading}
        style={{ marginTop: Spacing.xs }}
      />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color={Palette.gray[500]} weight="600">
          Remember your password?{' '}
        </AppText>
        <TouchableOpacity onPress={onLogin} disabled={loading}>
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});
