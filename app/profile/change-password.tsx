import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/errors';
import { changePassword } from '@/services/users/userApi';
import { useToast } from '@/hooks/useToast';
import { AppInput } from '@/components/ui/AppInput';

// ─── Password strength meter ──────────────────────────────────────────────────

function getStrength(pwd: string): { level: number; label: string; color: string } {
  if (!pwd) return { level: 0, label: '', color: '#E2E8F0' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: '#EF4444' };
  if (score <= 2) return { level: 2, label: 'Fair', color: '#F59E0B' };
  if (score <= 3) return { level: 3, label: 'Good', color: '#3B82F6' };
  if (score <= 4) return { level: 4, label: 'Strong', color: '#22C55E' };
  return { level: 5, label: 'Very Strong', color: '#059669' };
}

function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { level, label, color } = getStrength(password);
  const bars = [1, 2, 3, 4, 5];

  return (
    <View style={strengthStyles.container}>
      <View style={strengthStyles.bars}>
        {bars.map((b) => (
          <View
            key={b}
            style={[
              strengthStyles.bar,
              { backgroundColor: b <= level ? color : '#E2E8F0' },
            ]}
          />
        ))}
      </View>
      <AppText variant="caption" weight="700" color={color} style={strengthStyles.label}>
        {label}
      </AppText>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    minWidth: 60,
    textAlign: 'right',
  },
});

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  const handleSave = useCallback(async () => {
    if (!token) { showErrorToast('Please log in again.'); return; }
    if (!currentPassword || !newPassword) { showErrorToast('Enter your current and new password.'); return; }
    if (newPassword.length < 8) { showErrorToast('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { showErrorToast('New passwords do not match.'); return; }
    try {
      setSaving(true);
      const result = await changePassword(token, { currentPassword, newPassword });
      showSuccessToast(result.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.back();
    } catch (err) {
      showErrorToast(getErrorMessage(err) || 'Action failed.');
    } finally {
      setSaving(false);
    }
  }, [token, currentPassword, newPassword, confirmPassword, showSuccessToast, showErrorToast, router]);

  const strength = getStrength(newPassword);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ProfileScreenHeader title="Password & Security" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <AppText variant="bodySmall" color="#475569" style={styles.infoText}>
              Ensure your account is using a strong, unique password with letters, numbers, and symbols to stay secure.
            </AppText>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <AppInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
            />

            <AppInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
            />

            <StrengthBar password={newPassword} />

            {newPassword.length > 0 && strength.level < 4 && (
              <AppText variant="caption" color="#64748B" style={styles.tipText}>
                Tip: Add uppercase letters, numbers, and symbols to strengthen your password.
              </AppText>
            )}

            <AppInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              secureTextEntry
            />
          </View>

          <CustomButton
            title={saving ? 'Updating…' : 'Update Password'}
            onPress={handleSave}
            isLoading={saving}
            variant="primary"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ProfileTheme.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  infoBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    lineHeight: 20,
  },
  formSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  tipText: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
});
