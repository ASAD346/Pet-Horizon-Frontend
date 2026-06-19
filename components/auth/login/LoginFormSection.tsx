import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthErrorBanner } from '../AuthErrorBanner';
import { AuthTextField } from '../AuthTextField';
import { LoginTheme, Spacing } from '../../../constants/theme';

interface LoginFormSectionProps {
  email: string;
  password: string;
  loading: boolean;
  formError?: string | null;
  fieldErrors?: { email?: string; password?: string };
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onLogin: () => void;
  onForgotPassword: () => void;
  onSignup: () => void;
  onVerifyEmail?: () => void;
  showVerifyAction?: boolean;
}

export function LoginFormSection({
  email,
  password,
  loading,
  formError,
  fieldErrors,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onForgotPassword,
  onSignup,
  onVerifyEmail,
  showVerifyAction,
}: LoginFormSectionProps) {
  return (
    <View style={styles.container}>
      {formError ? <AuthErrorBanner message={formError} /> : null}

      <AuthTextField
        placeholder="Email Address"
        icon="mail-outline"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        error={fieldErrors?.email}
        autoCapitalize="none"
      />

      <AuthTextField
        placeholder="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        showPasswordToggle
        error={fieldErrors?.password}
      />

      {showVerifyAction && onVerifyEmail ? (
        <TouchableOpacity style={styles.verifyRow} onPress={onVerifyEmail}>
          <AppText variant="bodySmall" color={LoginTheme.green} weight="700">
            Verify your email to continue
          </AppText>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword}>
        <AppText variant="bodySmall" color={LoginTheme.green} weight="600">
          Forgot Password?
        </AppText>
      </TouchableOpacity>

      <AppButton
        title="Login"
        onPress={onLogin}
        loading={loading}
        disabled={loading}
        variant="success"
        size="sm"
        style={styles.loginButton}
        textStyle={styles.loginButtonText}
      />

      <View style={styles.signupRow}>
        <AppText variant="bodySmall" color={LoginTheme.tagline}>
          Didn&apos;t Have an Account?{' '}
        </AppText>
        <TouchableOpacity onPress={onSignup} disabled={loading}>
          <AppText variant="bodySmall" color={LoginTheme.green} weight="700">
            Signup
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  verifyRow: {
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  loginButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: LoginTheme.green,
    paddingVertical: 12,
    ...buttonShadow,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
});
