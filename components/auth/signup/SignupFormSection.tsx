import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../../ui/AppText';
import { CustomButton } from '../../ui/AppButton';
import { AuthTextField } from '../AuthTextField';
import { Palette, Spacing } from '../../../constants/theme';
import type { SignupFieldErrors } from '../../../services/auth/validation';
import { Ionicons } from '@expo/vector-icons';

interface SignupFormSectionProps {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  formError?: string | null;
  fieldErrors?: SignupFieldErrors;
  onFullNameChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  onSignUp: () => void;
  onLogin: () => void;
}

export function SignupFormSection({
  fullName,
  email,
  password,
  confirmPassword,
  loading,
  fieldErrors,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSignUp,
  onLogin,
}: SignupFormSectionProps) {
  return (
    <View style={styles.container}>
      {/* Form Section Header */}
      <View style={styles.headerBlock}>
        <AppText variant="h3" color="#1A2B4E" weight="800" style={styles.formTitle}>
          Create Account <Ionicons name="paw" size={18} color="#5CB35D" />
        </AppText>

        {/* Soft rounded accent line */}
        <View style={styles.accentLine} />

        <AppText variant="bodySmall" color={Palette.gray[500]} weight="700" style={styles.headerDescription}>
          Enter your details to register a profile
        </AppText>
      </View>

      <AuthTextField
        placeholder="Full Name"
        icon="person-outline"
        value={fullName}
        onChangeText={onFullNameChange}
        autoCapitalize="words"
        compact={false}
        error={fieldErrors?.fullName}
      />

      <AuthTextField
        placeholder="Email Address"
        icon="mail-outline"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        compact={false}
        error={fieldErrors?.email}
        autoCapitalize="none"
      />

      <AuthTextField
        placeholder="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        showPasswordToggle
        compact={false}
        error={fieldErrors?.password}
      />

      <AuthTextField
        placeholder="Confirm Password"
        icon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        secureTextEntry
        showPasswordToggle
        compact={false}
        error={fieldErrors?.confirmPassword}
      />

      <CustomButton
        title="Sign Up"
        onPress={onSignUp}
        isLoading={loading}
        disabled={loading}
        style={{ marginTop: Spacing.xs }}
      />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color={Palette.gray[500]} weight="600">
          Already have an account?{' '}
        </AppText>
        <TouchableOpacity onPress={onLogin} disabled={loading}>
          <AppText variant="bodySmall" color="#5CB35D" weight="800">
            Login
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
  formTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: '#1A2B4E',
  },
  accentLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F48024',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  headerDescription: {
    fontSize: 13,
    color: Palette.gray[500],
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
});
