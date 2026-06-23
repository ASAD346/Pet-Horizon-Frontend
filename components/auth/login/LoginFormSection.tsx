import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { AuthTextField } from '../AuthTextField';
import { Palette, Spacing } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

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
      {/* Form Section Header */}
      <View style={styles.headerBlock}>
        <AppText variant="h3" color="#1A2B4E" weight="800" style={styles.welcomeTitle}>
          Welcome Back <Ionicons name="sparkles" size={18} color="#F48024" />
        </AppText>
        
        {/* Soft rounded accent line */}
        <View style={styles.accentLine} />

        <AppText variant="bodySmall" color={Palette.gray[500]} weight="700" style={styles.headerDescription}>
          Enter your credentials to continue
        </AppText>
      </View>

      <AuthTextField
        placeholder="Email Address"
        icon="mail-outline"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        error={fieldErrors?.email}
        autoCapitalize="none"
        compact={false}
      />

      <AuthTextField
        placeholder="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        showPasswordToggle
        error={fieldErrors?.password}
        compact={false}
      />

      {showVerifyAction && onVerifyEmail ? (
        <TouchableOpacity style={styles.verifyRow} onPress={onVerifyEmail}>
          <AppText variant="bodySmall" color="#5CB35D" weight="700">
            Verify your email to continue
          </AppText>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword}>
        <AppText variant="bodySmall" color="#5CB35D" weight="700">
          Forgot Password?
        </AppText>
      </TouchableOpacity>

      <AppButton
        title="Login"
        onPress={onLogin}
        loading={loading}
        disabled={loading}
        style={styles.loginButton}
        textStyle={styles.loginButtonText}
      />

      <View style={styles.signupRow}>
        <AppText variant="bodySmall" color={Palette.gray[500]} weight="600">
          Don&apos;t have an account?{' '}
        </AppText>
        <TouchableOpacity onPress={onSignup} disabled={loading}>
          <AppText variant="bodySmall" color="#5CB35D" weight="800">
            Sign Up
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
  headerBlock: {
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: '#1A2B4E',
  },
  accentLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5CB35D',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  headerDescription: {
    fontSize: 13,
    color: Palette.gray[500],
  },
  verifyRow: {
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
    alignSelf: 'flex-start',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },
  loginButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#5CB35D',
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 0,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.5,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});
