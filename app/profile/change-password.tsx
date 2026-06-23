import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/errors';
import { changePassword } from '@/services/users/userApi';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleSave = useCallback(async () => {
    if (!token) {
      setError('Please log in again.');
      return;
    }
    if (!currentPassword || !newPassword) {
      setError('Enter your current and new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await changePassword(token, { currentPassword, newPassword });
      setSuccess(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [token, currentPassword, newPassword, confirmPassword]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ProfileScreenHeader title="Password & Security" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <AuthErrorBanner message={error} /> : null}
          {success ? <AuthInfoBanner message={success} /> : null}

          <SectionLabel text="CURRENT PASSWORD" />
          <View style={styles.inputContainer}>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor={SheetColors.placeholder}
              style={styles.input}
              secureTextEntry={!currentPasswordVisible}
            />
            <TouchableOpacity
              onPress={() => setCurrentPasswordVisible((prev) => !prev)}
              style={styles.toggleButton}
            >
              <Ionicons
                name={currentPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={SheetColors.placeholder}
              />
            </TouchableOpacity>
          </View>

          <SectionLabel text="NEW PASSWORD" />
          <View style={styles.inputContainer}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={SheetColors.placeholder}
              style={styles.input}
              secureTextEntry={!newPasswordVisible}
            />
            <TouchableOpacity
              onPress={() => setNewPasswordVisible((prev) => !prev)}
              style={styles.toggleButton}
            >
              <Ionicons
                name={newPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={SheetColors.placeholder}
              />
            </TouchableOpacity>
          </View>

          <SectionLabel text="CONFIRM NEW PASSWORD" />
          <View style={styles.inputContainer}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              placeholderTextColor={SheetColors.placeholder}
              style={styles.input}
              secureTextEntry={!confirmPasswordVisible}
            />
            <TouchableOpacity
              onPress={() => setConfirmPasswordVisible((prev) => !prev)}
              style={styles.toggleButton}
            >
              <Ionicons
                name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={SheetColors.placeholder}
              />
            </TouchableOpacity>
          </View>

          <AppButton
            title="Update Password"
            onPress={handleSave}
            loading={saving}
            variant="success"
            size="md"
            style={styles.submitBtn}
            textStyle={styles.submitText}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 14,
    color: SheetColors.inputText,
  },
  toggleButton: {
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  submitBtn: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 52,
    marginTop: Spacing.md,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
