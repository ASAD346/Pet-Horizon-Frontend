import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { PetPhotoPicker } from '@/components/pet';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { Radius, Spacing, Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { getErrorMessage } from '@/lib/api/errors';
import {
  requestEmailChange,
  updateUserProfile,
  verifyEmailChange,
  changePassword,
  deleteAccount,
} from '@/services/users/userApi';
import { uploadUserAvatar } from '@/services/users/uploadUserAvatar';
import { AppInput } from '@/components/ui/AppInput';
import { AppConfirmModal } from '@/components/ui/AppConfirmModal';

// ─── Password Strength Estimator ─────────────────────────────────────────────
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

// ─── Edit Profile Screen ─────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const { token, user, setSession, logout } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Password states
  const [passwordSectionExpanded, setPasswordSectionExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { showToast, showErrorToast } = useToast();

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? '');
    setEmail(user.email);
    setInitialEmail(user.email);
    setExistingPhotoUrl(resolveMediaUrl(user.profileImage));
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!token || !user?._id) { showErrorToast('Please log in again.'); return; }
    const trimmedName = fullName.trim();
    if (!trimmedName) { showErrorToast('Full name is required.'); return; }

    const hasPasswordInput = currentPassword || newPassword || confirmPassword;
    if (hasPasswordInput) {
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
    }

    setSaving(true);
    try {
      let nextUser = user;
      
      // 1. Update password inline if details are supplied
      if (hasPasswordInput) {
        await changePassword(token, { currentPassword, newPassword });
      }

      // 2. Update name/photo
      if (trimmedName !== (user.fullName ?? '')) {
        nextUser = await updateUserProfile(token, user._id, { fullName: trimmedName });
      }
      const localPhoto = photoUri && !photoUri.startsWith('http') ? photoUri : null;
      if (localPhoto) nextUser = await uploadUserAvatar(token, localPhoto);

      const emailChanged = email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();
      if (emailChanged) {
        const response = await requestEmailChange(token, email.trim());
        // Preserve activePetId — nextUser returned from server does not contain it
        await setSession({ token, user: { ...nextUser, activePetId: user?.activePetId } });
        setSaving(false);

        router.push({
          pathname: '/auth/verify-email',
          params: {
            email: email.trim().toLowerCase(),
            devOtp: response.devOtp || '',
          },
        });
        return;
      }

      // Reset password inputs on success
      if (hasPasswordInput) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSectionExpanded(false);
      }

      // Preserve activePetId — nextUser returned from server does not contain it
      await setSession({ token, user: { ...nextUser, activePetId: user?.activePetId } });
      showToast('Profile updated successfully!');
      router.back();
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [token, user, fullName, photoUri, email, initialEmail, currentPassword, newPassword, confirmPassword, setSession, router]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !user?._id) return;
    setDeleting(true);
    try {
      await deleteAccount(token, user._id);
      setDeleteConfirmVisible(false);
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }, [token, user?._id, logout, router]);

  const displayPhoto = photoUri ?? existingPhotoUrl ?? null;
  const strength = getStrength(newPassword);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ProfileScreenHeader
        title="Edit Profile"
        onBack={() => router.back()}
        rightLabel="Save"
        onRightPress={handleSave}
        rightDisabled={saving}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <PetPhotoPicker
                imageUri={displayPhoto}
                onImageChange={(uri) => setPhotoUri(uri)}
              />
            </View>
            <AppText variant="bodySmall" weight="700" style={styles.avatarHint}>
              Tap to change photo
            </AppText>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <AppInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
            />

            <View>
              <AppInput
                label="Email Address"
                value={email}
                placeholder="you@example.com"
                keyboardType="email-address"
                editable={false}
              />
            </View>
          </View>

          {/* Collapsible Security & Password Section Card */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={[styles.accordionHeader, passwordSectionExpanded && styles.accordionHeaderActive]}
              activeOpacity={0.8}
              onPress={() => setPasswordSectionExpanded(!passwordSectionExpanded)}
            >
              <View style={styles.accordionTitleRow}>
                <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(46, 125, 50, 0.08)' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#2E7D32" />
                </View>
                <View style={styles.actionTextBlock}>
                  <AppText variant="body" weight="700" color="#212121">
                    Security & Password
                  </AppText>
                  <AppText variant="caption" color="#64748B">
                    Update your account password
                  </AppText>
                </View>
              </View>
              <Ionicons
                name={passwordSectionExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            {passwordSectionExpanded && (
              <View style={styles.accordionContent}>
                <AppText variant="caption" color="#64748B" style={styles.accordionInfoText}>
                  Update your security details. Fill all three fields below to change your account password.
                </AppText>

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
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat new password"
                  secureTextEntry
                />
              </View>
            )}
          </View>

          <CustomButton
            title="Save Changes"
            onPress={handleSave}
            isLoading={saving}
            variant="primary"
          />

          {/* Danger Zone Section */}
          <View style={styles.actionsSection}>
            <AppText variant="bodySmall" weight="700" color="#EA4335" style={styles.actionsSectionTitle}>
              DANGER ZONE
            </AppText>

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.85}
              onPress={() => setDeleteConfirmVisible(true)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(234, 67, 53, 0.08)' }]}>
                <Ionicons name="trash-outline" size={20} color="#EA4335" />
              </View>
              <View style={styles.actionTextBlock}>
                <AppText variant="body" weight="700" color="#EA4335">
                  Delete Account
                </AppText>
                <AppText variant="caption" color="#64748B">
                  Permanently erase your data and profile
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone and all your pet profiles, schedules, and data will be lost forever."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    marginBottom: Spacing.sm,
  },
  avatarHint: {
    color: '#64748B',
  },
  formSection: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  accordionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  accordionHeaderActive: {
    backgroundColor: '#F8FAFC',
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accordionContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FCFCFD',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: Spacing.sm,
  },
  accordionInfoText: {
    marginBottom: Spacing.xs,
    lineHeight: 16,
    color: '#64748B',
  },
  tipText: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.xs,
    fontStyle: 'italic',
  },
  actionsSection: {
    marginTop: Spacing.xl,
  },
  actionsSectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: 4,
    letterSpacing: 0.5,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionTextBlock: {
    flex: 1,
  },
});

