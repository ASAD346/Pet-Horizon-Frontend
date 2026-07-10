import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VerifyEmailFormSection } from '@/components/auth/signup/VerifyEmailFormSection';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { verifyEmailChange, requestEmailChange } from '@/services/users/userApi';
import { getErrorMessage } from '@/lib/api/errors';
import { Spacing } from '@/constants/theme';
import { LoginHeaderDecor, LoginFooterBar } from '@/components/auth/login';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email = '', devOtp = '' } = useLocalSearchParams<{ email: string; devOtp?: string }>();
  const { token, user, setSession } = useAuth();
  const { showToast, showErrorToast } = useToast();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ otp?: string }>({});

  const handleVerify = useCallback(async () => {
    if (!token) {
      showErrorToast('Session expired. Please log in again.');
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      await verifyEmailChange(token, otp.trim());
      
      // Update session with the new email
      if (user) {
        const nextUser = { ...user, email: email.trim().toLowerCase() };
        await setSession({ token, user: nextUser });
      }

      showToast('Email verified and updated successfully!');
      
      // Navigate back to edit profile
      router.dismiss(1);
    } catch (error) {
      const msg = getErrorMessage(error);
      setFieldErrors({ otp: msg });
      showErrorToast(msg);
    } finally {
      setLoading(false);
    }
  }, [token, otp, email, user, setSession, showToast, showErrorToast, router]);

  const handleResendCode = useCallback(async () => {
    if (!token) return;
    setResendLoading(true);
    setFieldErrors({});

    try {
      const response = await requestEmailChange(token, email);
      showToast(response.message);
      if (response.devOtp) {
        showToast(`Dev code: ${response.devOtp}`);
      }
    } catch (error) {
      showErrorToast(getErrorMessage(error));
    } finally {
      setResendLoading(false);
    }
  }, [token, email, showToast, showErrorToast]);

  const handleBack = useCallback(() => {
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
            <View style={styles.formWrapper}>
              <VerifyEmailFormSection
                email={email}
                otp={otp}
                loading={loading}
                resendLoading={resendLoading}
                fieldErrors={fieldErrors}
                onOtpChange={(text) => {
                  setOtp(text.replace(/\D/g, '').slice(0, 6));
                  setFieldErrors({});
                }}
                onVerify={handleVerify}
                onResendCode={handleResendCode}
                onBack={handleBack}
              />
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
  formWrapper: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    marginTop: Spacing.xs,
  },
});
