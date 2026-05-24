import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  LoginBranding,
  LoginFooterBar,
  LoginHeaderDecor,
  SocialLoginButtons,
} from '@/components/auth/login';
import { SignupFormSection, VerifyEmailFormSection } from '@/components/auth/signup';
import {
  getAuthSignupErrorMessage,
  getAuthVerifyEmailErrorMessage,
} from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { LoginTheme, Spacing } from '@/constants/theme';
import {
  registerAccount,
  resendVerificationEmail,
  verifyEmail,
} from '@/services/auth/authApi';
import {
  hasSignupFieldErrors,
  hasVerifyEmailFieldErrors,
  validateEmailOnly,
  validateSignupForm,
  validateVerifyEmailForm,
  type SignupFieldErrors,
  type VerifyEmailFieldErrors,
} from '@/services/auth/validation';

type SignupStep = 'signup' | 'verify';

function parseVerifyParam(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === '1' || raw === 'true';
}

function parseEmailParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw : '';
}

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; verify?: string }>();

  const [step, setStep] = useState<SignupStep>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formInfo, setFormInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors | VerifyEmailFieldErrors>({});

  useEffect(() => {
    const initialEmail = parseEmailParam(params.email);
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (parseVerifyParam(params.verify)) {
      setStep('verify');
      setFormInfo('Enter the verification code sent to your email.');
    }
  }, [params.email, params.verify]);

  const clearErrors = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
  }, []);

  const goToVerifyStep = useCallback((message: string, devOtp?: string) => {
    setStep('verify');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    const devHint = devOtp ? ` Dev code: ${devOtp}` : '';
    setFormInfo(`${message}${devHint}`);
    setFormError(null);
    setFieldErrors({});
  }, []);

  const handleSignUp = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();
    setFormInfo(null);

    const validation = validateSignupForm(fullName, email, password, confirmPassword);
    if (hasSignupFieldErrors(validation)) {
      setFieldErrors(validation);
      return;
    }

    setLoading(true);

    try {
      const result = await registerAccount({ fullName, email, password });
      log.ok('Signup', 'Account created — verify next', { userId: result.userId });
      goToVerifyStep(result.message, result.devOtp);
    } catch (error) {
      log.fail('Signup', 'Sign up failed', getAuthSignupErrorMessage(error));
      setFormError(getAuthSignupErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearErrors, confirmPassword, email, fullName, goToVerifyStep, password]);

  const handleVerify = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();

    const validation = validateVerifyEmailForm(email, otp);
    if (hasVerifyEmailFieldErrors(validation)) {
      setFieldErrors(validation);
      return;
    }

    setLoading(true);

    try {
      const result = await verifyEmail({ email, otp });
      log.ok('Signup', 'Email verified — go to login');
      router.replace({
        pathname: '/auth/login',
        params: { verified: '1', message: result.message },
      });
    } catch (error) {
      log.fail('Signup', 'Verify failed', getAuthVerifyEmailErrorMessage(error));
      setFormError(getAuthVerifyEmailErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearErrors, email, otp, router]);

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
      const result = await resendVerificationEmail(email);
      const devHint = result.devOtp ? ` Dev code: ${result.devOtp}` : '';
      setFormInfo(`${result.message}${devHint}`);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to resend the code. Please try again.'));
    } finally {
      setResendLoading(false);
    }
  }, [clearErrors, email, otp]);

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
              {step === 'signup' ? (
                <SignupFormSection
                  fullName={fullName}
                  email={email}
                  password={password}
                  confirmPassword={confirmPassword}
                  loading={loading}
                  formError={formError}
                  fieldErrors={fieldErrors as SignupFieldErrors}
                  onFullNameChange={(text) => {
                    setFullName(text);
                    if (formError || (fieldErrors as SignupFieldErrors).fullName) clearErrors();
                  }}
                  onEmailChange={(text) => {
                    setEmail(text);
                    if (formError || (fieldErrors as SignupFieldErrors).email) clearErrors();
                  }}
                  onPasswordChange={(text) => {
                    setPassword(text);
                    if (formError || (fieldErrors as SignupFieldErrors).password) clearErrors();
                  }}
                  onConfirmPasswordChange={(text) => {
                    setConfirmPassword(text);
                    if (formError || (fieldErrors as SignupFieldErrors).confirmPassword) clearErrors();
                  }}
                  onSignUp={handleSignUp}
                  onLogin={handleLogin}
                />
              ) : (
                <VerifyEmailFormSection
                  email={email}
                  otp={otp}
                  loading={loading}
                  resendLoading={resendLoading}
                  formError={formError}
                  formInfo={formInfo}
                  fieldErrors={fieldErrors as VerifyEmailFieldErrors}
                  emailEditable={!email.trim()}
                  onEmailChange={(text) => {
                    setEmail(text);
                    if (formError || (fieldErrors as VerifyEmailFieldErrors).email) clearErrors();
                  }}
                  onOtpChange={(text) => {
                    setOtp(text.replace(/\D/g, '').slice(0, 6));
                    if (formError || (fieldErrors as VerifyEmailFieldErrors).otp) clearErrors();
                  }}
                  onVerify={handleVerify}
                  onResendCode={handleResendCode}
                  onLogin={handleLogin}
                />
              )}

              {step === 'signup' ? (
                <SocialLoginButtons
                  compact
                  onGooglePress={() => {}}
                  onApplePress={() => {}}
                />
              ) : null}
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
