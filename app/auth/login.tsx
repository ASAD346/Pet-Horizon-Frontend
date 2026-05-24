import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  LoginBranding,
  LoginFooterBar,
  LoginFormSection,
  LoginHeaderDecor,
  SocialLoginButtons,
} from '@/components/auth/login';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useAuth, getAuthLoginErrorMessage } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { LoginTheme, Spacing } from '@/constants/theme';
import {
  hasFieldErrors,
  validateLoginForm,
  type LoginFieldErrors,
} from '@/services/auth/validation';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verified?: string; message?: string }>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [showVerifyAction, setShowVerifyAction] = useState(false);

  React.useEffect(() => {
    const verified = params.verified === '1' || params.verified === 'true';
    const message = Array.isArray(params.message) ? params.message[0] : params.message;
    if (verified && message) {
      setSuccessMessage(message);
    }
  }, [params.message, params.verified]);

  const clearErrors = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setShowVerifyAction(false);
  }, []);

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (formError || fieldErrors.email) {
        clearErrors();
      }
    },
    [clearErrors, fieldErrors.email, formError],
  );

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      if (formError || fieldErrors.password) {
        clearErrors();
      }
    },
    [clearErrors, fieldErrors.password, formError],
  );

  const navigateAfterLogin = useCallback(
    (activePetId?: string | null) => {
      if (activePetId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/pet/register');
      }
    },
    [router],
  );

  const handleLogin = useCallback(async () => {
    Keyboard.dismiss();
    clearErrors();

    const validation = validateLoginForm(email, password);
    if (hasFieldErrors(validation)) {
      setFieldErrors(validation);
      return;
    }

    setLoading(true);

    try {
      const session = await login(email, password);
      log.ok('Login', 'UI success — routing', {
        activePetId: session.user.activePetId ?? null,
      });
      navigateAfterLogin(session.user.activePetId);
    } catch (error) {
      const message = getAuthLoginErrorMessage(error);
      log.fail('Login', 'UI error', message);
      setFormError(message);

      if (error instanceof ApiError && error.isForbidden) {
        setShowVerifyAction(true);
      }
    } finally {
      setLoading(false);
    }
  }, [clearErrors, email, login, navigateAfterLogin, password]);

  const handleVerifyEmail = useCallback(() => {
    router.push({
      pathname: '/auth/signup',
      params: { email: email.trim().toLowerCase(), verify: '1' },
    });
  }, [email, router]);

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
              <LoginBranding />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).duration(700)} style={styles.formBlock}>
              {successMessage ? <AuthInfoBanner message={successMessage} /> : null}

              <LoginFormSection
                email={email}
                password={password}
                loading={loading}
                formError={formError}
                fieldErrors={fieldErrors}
                onEmailChange={handleEmailChange}
                onPasswordChange={handlePasswordChange}
                onLogin={handleLogin}
                onForgotPassword={() => {}}
                onSignup={() => router.push('/auth/signup')}
                onVerifyEmail={handleVerifyEmail}
                showVerifyAction={showVerifyAction}
              />

              <SocialLoginButtons
                onGooglePress={() => {}}
                onApplePress={() => {}}
              />
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
    paddingTop: Spacing.sm,
    justifyContent: 'space-between',
  },
  formBlock: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: Spacing.md,
  },
});
