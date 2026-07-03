import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../../ui/AppText';
import { CustomButton } from '../../ui/AppButton';
import { AuthTextField } from '../AuthTextField';
import { Palette, Spacing } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/components/ui/LanguageProvider';

interface LoginFormSectionProps {
  email: string;
  password: string;
  loading: boolean;
  formError?: string | null;
  fieldErrors?: { email?: string; password?: string };
  rememberMe: boolean;
  onRememberMeChange: (val: boolean) => void;
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
  rememberMe,
  onRememberMeChange,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onForgotPassword,
  onSignup,
  onVerifyEmail,
  showVerifyAction,
}: LoginFormSectionProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {/* Form Section Header */}
      <View style={styles.headerBlock}>
        <AppText variant="h3" color="#1A2B4E" weight="800" style={styles.welcomeTitle}>
          {t('welcomeBack', 'Welcome Back')} <Ionicons name="sparkles" size={18} color="#F48024" />
        </AppText>
        
        {/* Soft rounded accent line */}
        <View style={styles.accentLine} />
 
        <AppText variant="bodySmall" color={Palette.gray[500]} weight="700" style={styles.headerDescription}>
          {t('enterCredentials', 'Enter your credentials to continue')}
        </AppText>
      </View>

      <AuthTextField
        placeholder={t('email', 'Email Address')}
        icon="mail-outline"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        error={fieldErrors?.email}
        autoCapitalize="none"
        compact={false}
      />

      <AuthTextField
        placeholder={t('password', 'Password')}
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
            {t('verifyEmailContinue', 'Verify your email to continue')}
          </AppText>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => onRememberMeChange(!rememberMe)} activeOpacity={0.7}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
            {rememberMe ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
          </View>
          <AppText variant="bodySmall" color={Palette.gray[600]} weight="600">
            {t('rememberMe', 'Remember me')}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={onForgotPassword}>
          <AppText variant="bodySmall" color="#5CB35D" weight="700">
            {t('forgotPassword', 'Forgot Password?')}
          </AppText>
        </TouchableOpacity>
      </View>

      <CustomButton
        title={t('login', 'Login')}
        onPress={onLogin}
        isLoading={loading}
        disabled={loading}
        style={styles.loginButton}
      />

      <View style={styles.signupRow}>
        <AppText variant="bodySmall" color={Palette.gray[500]} weight="600">
          {t('noAccount', "Don't have an account?")}{' '}
        </AppText>
        <TouchableOpacity onPress={onSignup} disabled={loading}>
          <AppText variant="bodySmall" color="#5CB35D" weight="800">
            {t('signUp', 'Sign Up')}
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
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#114227',
    borderColor: '#114227',
  },
  loginButton: {
    // height/borderRadius/colors are owned by CustomButton's design tokens.
    // Only add layout-level overrides here.
    width: '100%',
    shadowColor: '#114227',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});
