import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthErrorBanner } from '../AuthErrorBanner';
import { AuthTextField } from '../AuthTextField';
import { LoginTheme, Spacing } from '../../../constants/theme';
import type { SignupFieldErrors } from '../../../services/auth/validation';

interface SignupFormSectionProps {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  formError?: string | null;
  fieldErrors?: SignupFieldErrors;
  onFullNameChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  onSignUp: () => void;
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

export function SignupFormSection({
  fullName,
  email,
  password,
  confirmPassword,
  loading,
  formError,
  fieldErrors,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSignUp,
  onLogin,
}: SignupFormSectionProps) {
  return (
    <View style={styles.container}>
      {formError ? <AuthErrorBanner message={formError} /> : null}

      <AuthTextField
        placeholder="Full Name"
        icon="person-outline"
        value={fullName}
        onChangeText={onFullNameChange}
        autoCapitalize="words"
        compact
        error={fieldErrors?.fullName}
      />

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

      <AuthTextField
        placeholder="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        compact
        error={fieldErrors?.password}
      />

      <AuthTextField
        placeholder="Confirm Password"
        icon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        secureTextEntry
        compact
        error={fieldErrors?.confirmPassword}
      />

      <AppButton
        title="Sign Up"
        onPress={onSignUp}
        loading={loading}
        disabled={loading}
        variant="success"
        size="sm"
        style={styles.signUpButton}
        textStyle={styles.signUpButtonText}
      />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color={LoginTheme.tagline}>
          Already Have an account?{' '}
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
  signUpButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: LoginTheme.green,
    paddingVertical: 12,
    marginTop: Spacing.xs,
    ...buttonShadow,
  },
  signUpButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
});
