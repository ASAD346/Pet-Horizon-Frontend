import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from '@/lib/auth/authErrors';
import { log } from '@/lib/log';
import { Spacing } from '@/constants/theme';
import { requestPasswordReset, resetPassword } from '@/services/auth/authApi';
import { useToast } from '@/hooks/useToast';
import {
  hasForgotPasswordFieldErrors,
  hasResetPasswordFieldErrors,
  validateForgotPasswordForm,
  validateResetPasswordForm,
  validateEmailOnly,
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
  const { showToast } = useToast();

  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
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
    setFieldErrors({});
  }, []);

  const goToResetStep = useCallback(
    (message: string, options: { devOtp?: string; expiresInMinutes?: number; hint?: string } = {}) => {
      setStep('reset');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      const info = buildResetInfoMessage(message, options);
      showToast(info);
      setFieldErrors({});
    },
    [showToast],
  );

  const handleSendCode = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();

    const validation = validateForgotPasswordForm(email);
    if (hasForgotPasswordFieldErrors(validation)) {
      setFieldErrors(validation);
      return;
    }

    setLoading(true);

    try {
      const result = await requestPasswordReset({ email });
      log.ok('ForgotPassword', 'Reset code requested');

      if (result.emailConfigured && result.emailSent === false) {
        const deliveryError =
          result.emailError ||
          result.hint ||
          'We could not send the reset email. Check the address or try again.';
        showToast(deliveryError);
        return;
      }

      goToResetStep(result.message, {
        devOtp: result.devOtp,
        expiresInMinutes: result.expiresInMinutes,
        hint: result.hint,
      });
    } catch (error) {
      log.fail('ForgotPassword', 'Request code failed', getAuthForgotPasswordErrorMessage(error));
      showToast(getAuthForgotPasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearErrors, email, goToResetStep, showToast]);

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
      showToast(getAuthResetPasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearErrors, confirmPassword, email, newPassword, otp, router, showToast]);

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

      if (result.emailConfigured && result.emailSent === false) {
        showToast(
          result.emailError ||
            result.hint ||
            'We could not send the reset email. Check the address or try again.',
        );
        return;
      }

      const info = buildResetInfoMessage(result.message, {
        devOtp: result.devOtp,
        expiresInMinutes: result.expiresInMinutes,
        hint: result.hint,
      });
      showToast(info);
    } catch (error) {
      showToast(getAuthForgotPasswordErrorMessage(error));
    } finally {
      setResendLoading(false);
    }
  }, [clearErrors, email, showToast]);

  const handleLogin = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.root}>
      <LoginHeaderDecor />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.contentWrapper}>
              <View>
                <LoginBranding compact={true} />
              </View>

              <View style={styles.formWrapper}>
                {step === 'request' ? (
                  <ForgotPasswordFormSection
                    email={email}
                    loading={loading}
                    fieldErrors={fieldErrors as ForgotPasswordFieldErrors}
                    onEmailChange={(text) => {
                      setEmail(text);
                      clearErrors();
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
                    fieldErrors={fieldErrors as ResetPasswordFieldErrors}
                    onEmailChange={(text) => {
                      setEmail(text);
                      clearErrors();
                    }}
                    onOtpChange={(text) => {
                      setOtp(text.replace(/\D/g, '').slice(0, 6));
                      clearErrors();
                    }}
                    onNewPasswordChange={(text) => {
                      setNewPassword(text);
                      clearErrors();
                    }}
                    onConfirmPasswordChange={(text) => {
                      setConfirmPassword(text);
                      clearErrors();
                    }}
                    onResetPassword={handleResetPassword}
                    onResendCode={handleResendCode}
                    onLogin={handleLogin}
                  />
                )}
              </View>
            </View>
            <LoginFooterBar />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
    justifyContent: 'center',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    marginTop: Spacing.xs,
  },
});
