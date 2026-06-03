import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  LoginBranding,
  LoginFooterBar,
  LoginHeaderDecor,
} from '@/components/auth/login';
import {
  ForgotPasswordFormSection,
  ResetPasswordFormSection,
} from '@/components/auth/forgot-password';
import {
  getAuthForgotPasswordErrorMessage,
  getAuthResetPasswordErrorMessage,
} from '@/contexts/AuthContext';
import { log } from '@/lib/log';
import { LoginTheme, Spacing } from '@/constants/theme';
import { requestPasswordReset, resetPassword } from '@/services/auth/authApi';
import {
  hasForgotPasswordFieldErrors,
  hasResetPasswordFieldErrors,
  validateEmailOnly,
  validateForgotPasswordForm,
  validateResetPasswordForm,
  type ForgotPasswordFieldErrors,
  type ResetPasswordFieldErrors,
} from '@/services/auth/validation';

type ForgotPasswordStep = 'request' | 'reset';

function parseEmailParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw : '';
}

function buildResetInfoMessage(
  message: string,
  options: { devOtp?: string; expiresInMinutes?: number; hint?: string },
): string {
  const parts = [message];
  if (options.expiresInMinutes) {
    parts.push(`Code expires in ${options.expiresInMinutes} minutes.`);
  }
  if (options.devOtp) {
    parts.push(`Dev code: ${options.devOtp}`);
  }
  if (options.hint) {
    parts.push(options.hint);
  }
  return parts.join(' ');
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formInfo, setFormInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    ForgotPasswordFieldErrors | ResetPasswordFieldErrors
  >({});

  useEffect(() => {
    const initialEmail = parseEmailParam(params.email);
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [params.email]);

  const clearErrors = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
  }, []);

  const goToResetStep = useCallback(
    (message: string, options: { devOtp?: string; expiresInMinutes?: number; hint?: string } = {}) => {
      setStep('reset');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setFormInfo(buildResetInfoMessage(message, options));
      setFormError(null);
      setFieldErrors({});
    },
    [],
  );

  const handleSendCode = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();
    setFormInfo(null);

    const validation = validateForgotPasswordForm(email);
    if (hasForgotPasswordFieldErrors(validation)) {
      setFieldErrors(validation);
      return;
    }

    setLoading(true);

    try {
      const result = await requestPasswordReset({ email });
      log.ok('ForgotPassword', 'Reset code requested');
      goToResetStep(result.message, {
        devOtp: result.devOtp,
        expiresInMinutes: result.expiresInMinutes,
        hint: result.hint,
      });
    } catch (error) {
      log.fail('ForgotPassword', 'Request code failed', getAuthForgotPasswordErrorMessage(error));
      setFormError(getAuthForgotPasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearErrors, email, goToResetStep]);

  const handleResetPassword = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();

    const validation = validateResetPasswordForm(email, otp, newPassword, confirmPassword);
    if (hasResetPasswordFieldErrors(validation)) {
      setFieldErrors(validation);
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword({ email, otp, newPassword });
      log.ok('ForgotPassword', 'Password reset — go to login');
      router.replace({
        pathname: '/auth/login',
        params: { verified: '1', message: result.message },
      });
    } catch (error) {
      log.fail('ForgotPassword', 'Reset failed', getAuthResetPasswordErrorMessage(error));
      setFormError(getAuthResetPasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearErrors, confirmPassword, email, newPassword, otp, router]);

  const handleResendCode = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();

    const emailError = validateEmailOnly(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }

    setResendLoading(true);

    try {
      const result = await requestPasswordReset({ email });
      setFormInfo(
        buildResetInfoMessage(result.message, {
          devOtp: result.devOtp,
          expiresInMinutes: result.expiresInMinutes,
          hint: result.hint,
        }),
      );
    } catch (error) {
      setFormError(getAuthForgotPasswordErrorMessage(error));
    } finally {
      setResendLoading(false);
    }
  }, [clearErrors, email]);

  const handleLogin = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.root}>
      <LoginHeaderDecor />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.content}>
            <Animated.View entering={FadeIn.duration(700)}>
              <LoginBranding compact />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).duration(700)} style={styles.formBlock}>
              {step === 'request' ? (
                <ForgotPasswordFormSection
                  email={email}
                  loading={loading}
                  formError={formError}
                  fieldErrors={fieldErrors as ForgotPasswordFieldErrors}
                  onEmailChange={(text) => {
                    setEmail(text);
                    if (formError || (fieldErrors as ForgotPasswordFieldErrors).email) clearErrors();
                  }}
                  onSendCode={handleSendCode}
                  onLogin={handleLogin}
                />
              ) : (
                <ResetPasswordFormSection
                  email={email}
                  otp={otp}
                  newPassword={newPassword}
                  confirmPassword={confirmPassword}
                  loading={loading}
                  resendLoading={resendLoading}
                  formError={formError}
                  formInfo={formInfo}
                  fieldErrors={fieldErrors as ResetPasswordFieldErrors}
                  onEmailChange={(text) => {
                    setEmail(text);
                    if (formError || (fieldErrors as ResetPasswordFieldErrors).email) clearErrors();
                  }}
                  onOtpChange={(text) => {
                    setOtp(text.replace(/\D/g, '').slice(0, 6));
                    if (formError || (fieldErrors as ResetPasswordFieldErrors).otp) clearErrors();
                  }}
                  onNewPasswordChange={(text) => {
                    setNewPassword(text);
                    if (formError || (fieldErrors as ResetPasswordFieldErrors).newPassword) clearErrors();
                  }}
                  onConfirmPasswordChange={(text) => {
                    setConfirmPassword(text);
                    if (formError || (fieldErrors as ResetPasswordFieldErrors).confirmPassword) {
                      clearErrors();
                    }
                  }}
                  onResetPassword={handleResetPassword}
                  onResendCode={handleResendCode}
                  onLogin={handleLogin}
                />
              )}
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <LoginFooterBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LoginTheme.screenBg,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    justifyContent: 'space-between',
  },
  formBlock: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: Spacing.sm,
  },
});
