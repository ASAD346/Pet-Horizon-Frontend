import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from '@/lib/auth/authErrors';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { Spacing } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useToast } from '@/hooks/useToast';
import {
  registerAccount,
  resendVerificationEmail,
  verifyEmail,
} from '@/services/auth/authApi';
import {
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
  const { handleGoogleSignIn, googleLoading } = useGoogleAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<SignupStep>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors | VerifyEmailFieldErrors>({});

  useEffect(() => {
    const initialEmail = parseEmailParam(params.email);
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (parseVerifyParam(params.verify)) {
      setStep('verify');
    }
  }, [params.email, params.verify]);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const goToVerifyStep = useCallback(
    (message: string, devOtp?: string) => {
      showToast(message);
      if (devOtp) {
        showToast(`Dev code: ${devOtp}`);
      }
      setStep('verify');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setFieldErrors({});
    },
    [showToast],
  );

  const handleSignUp = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();

    setLoading(true);

    try {
      const result = await registerAccount({ fullName, email, password });
      log.ok('Signup', 'Account created — verify next', { userId: result.userId });
      goToVerifyStep(result.message, result.devOtp);
    } catch (error) {
      log.fail('Signup', 'Sign up failed', getAuthSignupErrorMessage(error));
      showToast(getAuthSignupErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearErrors, confirmPassword, email, fullName, goToVerifyStep, password, showToast]);

  const handleVerify = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();

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
      showToast(getAuthVerifyEmailErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearErrors, email, otp, router, showToast]);

  const handleResendCode = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();

    setResendLoading(true);

    try {
      const result = await resendVerificationEmail(email);
      showToast(result.message);
      if (result.devOtp) {
        showToast(`Dev code: ${result.devOtp}`);
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to resend the code. Please try again.'));
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

      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
                {step === 'signup' ? (
                  <SignupFormSection
                    fullName={fullName}
                    email={email}
                    password={password}
                    confirmPassword={confirmPassword}
                    loading={loading}
                    fieldErrors={fieldErrors as SignupFieldErrors}
                    onFullNameChange={(text) => {
                      setFullName(text);
                      clearErrors();
                    }}
                    onEmailChange={(text) => {
                      setEmail(text);
                      clearErrors();
                    }}
                    onPasswordChange={(text) => {
                      setPassword(text);
                      clearErrors();
                    }}
                    onConfirmPasswordChange={(text) => {
                      setConfirmPassword(text);
                      clearErrors();
                    }}
                    onSignUp={handleSignUp}
                    onLogin={handleLogin}
                  />
                ) : (
                  <VerifyEmailFormSection
                    otp={otp}
                    loading={loading}
                    resendLoading={resendLoading}
                    fieldErrors={fieldErrors as VerifyEmailFieldErrors}
                    onOtpChange={(text) => {
                      setOtp(text.replace(/\D/g, '').slice(0, 6));
                      clearErrors();
                    }}
                    onVerify={handleVerify}
                    onResendCode={handleResendCode}
                    onLogin={handleLogin}
                  />
                )}

                {step === 'signup' ? (
                  <SocialLoginButtons
                    compact={false}
                    googleLoading={googleLoading}
                    onGooglePress={() => {
                      clearErrors();
                      void handleGoogleSignIn(showToast);
                    }}
                    onApplePress={() => {}}
                  />
                ) : null}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <LoginFooterBar />
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
    maxWidth: 340, // Standard elegant phone input width bounds
    alignSelf: 'center',
    marginTop: Spacing.xs,
  },
});
