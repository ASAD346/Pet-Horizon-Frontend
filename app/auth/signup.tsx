import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  LoginBranding,
  LoginFooterBar,
  LoginHeaderDecor,
  SocialLoginButtons,
} from '../../components/auth/login';
import { SignupFormSection } from '../../components/auth/signup';
import { LoginTheme, Spacing } from '../../constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

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
              <SignupFormSection
                fullName={fullName}
                email={email}
                password={password}
                confirmPassword={confirmPassword}
                loading={loading}
                onFullNameChange={setFullName}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onSignUp={handleSignUp}
                onLogin={() => router.back()}
              />

              <SocialLoginButtons
                compact
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
    paddingTop: Spacing.xs,
    justifyContent: 'space-between',
  },
  formBlock: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: Spacing.sm,
  },
});
