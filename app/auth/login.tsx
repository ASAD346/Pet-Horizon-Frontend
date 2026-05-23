import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { Spacing, Palette, Radius } from '../../constants/theme';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      // router.replace('/(tabs)');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            contentFit="contain"
          />
          <AppText variant="h2" align="center" style={styles.title}>
            Welcome Back
          </AppText>
          <AppText variant="body" color={Palette.gray[500]} align="center">
            Sign in to continue your journey with your pets
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.form}>
          <AppInput 
            label="Email Address"
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          
          <AppInput 
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <AppText variant="bodySmall" color={Palette.primary.base} weight="600">
              Forgot Password?
            </AppText>
          </TouchableOpacity>

          <AppButton 
            title="Sign In" 
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.footer}>
            <AppText variant="bodySmall" color={Palette.gray[600]}>
              Don't have an account?{' '}
            </AppText>
            <TouchableOpacity onPress={() => {}}>
              <AppText variant="bodySmall" color={Palette.secondary.base} weight="700">
                Sign Up
              </AppText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 150,
    height: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  loginButton: {
    marginTop: Spacing.md,
    shadowColor: Palette.primary.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
});
