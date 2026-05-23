import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthTextField } from '../AuthTextField';
import { LoginTheme, Spacing } from '../../../constants/theme';

interface LoginFormSectionProps {
  email: string;
  password: string;
  loading: boolean;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onLogin: () => void;
  onForgotPassword: () => void;
  onSignup: () => void;
}

export function LoginFormSection({
  email,
  password,
  loading,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onForgotPassword,
  onSignup,
}: LoginFormSectionProps) {
  return (
    <View style={styles.container}>
      <AuthTextField
        placeholder="Email Address"
        icon="mail-outline"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
      />

      <AuthTextField
        placeholder="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
      />

      <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword}>
        <AppText variant="bodySmall" color={LoginTheme.green} weight="600">
          Forgot Password?
        </AppText>
      </TouchableOpacity>

      <AppButton
        title="Login"
        onPress={onLogin}
        loading={loading}
        variant="success"
        size="sm"
        style={styles.loginButton}
        textStyle={styles.loginButtonText}
      />

      <View style={styles.signupRow}>
        <AppText variant="bodySmall" color={LoginTheme.tagline}>
          Didn&apos;t Have an Account?{' '}
        </AppText>
        <TouchableOpacity onPress={onSignup}>
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
