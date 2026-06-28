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
import { CustomButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/errors';
import { changePassword } from '@/services/users/userApi';
import { useToast } from '@/hooks/useToast';

import { homeCardShadow } from '@/components/home/homeStyles';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Focus tracking state
  const [activeField, setActiveField] = useState<'current' | 'new' | 'confirm' | null>(null);

  const handleSave = useCallback(async () => {
    if (!token) {
      showErrorToast('Please log in again.');
      return;
    }
    if (!currentPassword || !newPassword) {
      showErrorToast('Enter your current and new password.');
      return;
    }
    if (newPassword.length < 8) {
      showErrorToast('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorToast('New passwords do not match.');
      return;
    }

    try {
      setSaving(true);
      const result = await changePassword(token, { currentPassword, newPassword });
      showSuccessToast(result.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.back();
    } catch (err) {
      showErrorToast(getErrorMessage(err) || 'Action failed: You don\'t have permission to modify this.');
    } finally {
      setSaving(false);
    }
  }, [token, currentPassword, newPassword, confirmPassword, showSuccessToast, showErrorToast, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ProfileScreenHeader title="Password & Security" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            {/* Current Password */}
            <View style={styles.labelContainer}>
              <View style={[styles.labelDot, activeField === 'current' && styles.labelDotActive]} />
              <AppText variant="caption" weight="800" color={activeField === 'current' ? '#2E7D32' : '#64748B'} style={styles.labelText}>
                CURRENT PASSWORD
              </AppText>
            </View>
            <View style={[
              styles.inputContainer,
              activeField === 'current' && styles.inputContainerActive
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={18} 
                color={activeField === 'current' ? '#2E7D32' : '#94A3B8'} 
                style={styles.fieldIcon}
              />
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={SheetColors.placeholder}
                style={styles.input}
                secureTextEntry={!currentPasswordVisible}
                onFocus={() => setActiveField('current')}
                onBlur={() => setActiveField(null)}
              />
              <TouchableOpacity
                onPress={() => setCurrentPasswordVisible((prev) => !prev)}
                style={styles.toggleButton}
              >
                <Ionicons
                  name={currentPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={SheetColors.placeholder}
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View style={styles.labelContainer}>
              <View style={[styles.labelDot, activeField === 'new' && styles.labelDotActive]} />
              <AppText variant="caption" weight="800" color={activeField === 'new' ? '#2E7D32' : '#64748B'} style={styles.labelText}>
                NEW PASSWORD
              </AppText>
            </View>
            <View style={[
              styles.inputContainer,
              activeField === 'new' && styles.inputContainerActive
            ]}>
              <Ionicons 
                name="shield-outline" 
                size={18} 
                color={activeField === 'new' ? '#2E7D32' : '#94A3B8'} 
                style={styles.fieldIcon}
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={SheetColors.placeholder}
                style={styles.input}
                secureTextEntry={!newPasswordVisible}
                onFocus={() => setActiveField('new')}
                onBlur={() => setActiveField(null)}
              />
              <TouchableOpacity
                onPress={() => setNewPasswordVisible((prev) => !prev)}
                style={styles.toggleButton}
              >
                <Ionicons
                  name={newPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={SheetColors.placeholder}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.labelContainer}>
              <View style={[styles.labelDot, activeField === 'confirm' && styles.labelDotActive]} />
              <AppText variant="caption" weight="800" color={activeField === 'confirm' ? '#2E7D32' : '#64748B'} style={styles.labelText}>
                CONFIRM NEW PASSWORD
              </AppText>
            </View>
            <View style={[
              styles.inputContainer,
              activeField === 'confirm' && styles.inputContainerActive
            ]}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={18} 
                color={activeField === 'confirm' ? '#2E7D32' : '#94A3B8'} 
                style={styles.fieldIcon}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat new password"
                placeholderTextColor={SheetColors.placeholder}
                style={styles.input}
                secureTextEntry={!confirmPasswordVisible}
                onFocus={() => setActiveField('confirm')}
                onBlur={() => setActiveField(null)}
              />
              <TouchableOpacity
                onPress={() => setConfirmPasswordVisible((prev) => !prev)}
                style={styles.toggleButton}
              >
                <Ionicons
                  name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={SheetColors.placeholder}
                />
              </TouchableOpacity>
            </View>
          </View>

          <CustomButton
            title="Update Password"
            onPress={handleSave}
            isLoading={saving}
            variant="primary"
            style={{ marginTop: Spacing.sm }}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      }
    })
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
    paddingLeft: 2,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  labelDotActive: {
    backgroundColor: '#2E7D32',
  },
  labelText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputContainerActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#FCFDFC',
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  fieldIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: SheetColors.inputText,
    marginLeft: 2,
  },
  toggleButton: {
    paddingLeft: Spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
