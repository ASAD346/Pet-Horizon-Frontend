import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LoginBranding,
  LoginFooterBar,
  LoginFormSection,
  LoginHeaderDecor,
  SocialLoginButtons,
} from '@/components/auth/login';
import { AuthEntryLoader, useAuthEntryRedirect } from '@/components/auth/AuthEntryRedirect';
import { getAuthLoginErrorMessage } from '@/lib/auth/authErrors';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { Spacing } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verified?: string; message?: string; redirect?: string }>();
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const { showToast } = useToast();
  const { handleGoogleSignIn, googleLoading } = useGoogleAuth();

  useAuthEntryRedirect(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyAction, setShowVerifyAction] = useState(false);
  const loginInFlightRef = useRef(false);

  React.useEffect(() => {
    const verified = params.verified === '1' || params.verified === 'true';
    const message = Array.isArray(params.message) ? params.message[0] : params.message;
    if (verified && message) {
      showToast(message);
    }
  }, [params.message, params.verified, showToast]);

  const clearErrors = useCallback(() => {
    setShowVerifyAction(false);
  }, []);

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      clearErrors();
    },
    [clearErrors],
  );

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      clearErrors();
    },
    [clearErrors],
  );

  const redirectPath = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;

  const navigateAfterLogin = useCallback(
    (activePetId?: string | null) => {
      if (redirectPath) {
        router.replace(redirectPath as Parameters<typeof router.replace>[0]);
        return;
      }
      if (activePetId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/pet/register');
      }
    },
    [redirectPath, router],
  );

  const handleLogin = useCallback(async () => {
    if (loginInFlightRef.current) return;

    Keyboard.dismiss();
    clearErrors();

    loginInFlightRef.current = true;
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
      showToast(message);

      if (error instanceof ApiError && error.isForbidden) {
        setShowVerifyAction(true);
      }
    } finally {
      loginInFlightRef.current = false;
      setLoading(false);
    }
  }, [clearErrors, email, login, navigateAfterLogin, password, showToast]);

  const handleVerifyEmail = useCallback(() => {
    router.push({
      pathname: '/auth/signup',
      params: { email: email.trim().toLowerCase(), verify: '1' },
    });
  }, [email, router]);

  if (isBootstrapping || isAuthenticated) {
    return <AuthEntryLoader />;
  }

  return (
    <View style={styles.root}>
      <LoginHeaderDecor />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
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
                <LoginFormSection
                  email={email}
                  password={password}
                  loading={loading}
                  fieldErrors={{}}
                  onEmailChange={handleEmailChange}
                  onPasswordChange={handlePasswordChange}
                  onLogin={handleLogin}
                  onForgotPassword={() =>
                    router.push({
                      pathname: '/auth/forgot-password',
                      params: email.trim() ? { email: email.trim().toLowerCase() } : undefined,
                    })
                  }
                  onSignup={() => router.push('/auth/signup')}
                  onVerifyEmail={handleVerifyEmail}
                  showVerifyAction={showVerifyAction}
                />

                <SocialLoginButtons
                  compact={false}
                  googleLoading={googleLoading}
                  onGooglePress={() => {
                    clearErrors();
                    void handleGoogleSignIn(showToast);
                  }}
                  onApplePress={() => {}}
                />
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
