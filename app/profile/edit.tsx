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
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { PetPhotoPicker } from '@/components/pet';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { getErrorMessage } from '@/lib/api/errors';
import {
  requestEmailChange,
  updateUserProfile,
  verifyEmailChange,
} from '@/services/users/userApi';
import { deleteAccount } from '@/services/users/userApi';
import { uploadUserAvatar } from '@/services/users/uploadUserAvatar';
import { AppInput } from '@/components/ui/AppInput';
import { AppConfirmModal } from '@/components/ui/AppConfirmModal';

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
    setSaving(true);
    try {
      let nextUser = user;
      if (trimmedName !== (user.fullName ?? '')) {
        nextUser = await updateUserProfile(token, user._id, { fullName: trimmedName });
      }
      const localPhoto = photoUri && !photoUri.startsWith('http') ? photoUri : null;
      if (localPhoto) nextUser = await uploadUserAvatar(token, localPhoto);

      const emailChanged = email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();
      if (emailChanged) {
        const response = await requestEmailChange(token, email.trim());
        await setSession({ token, user: nextUser });
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
      await setSession({ token, user: nextUser });
      showToast('Profile updated successfully!');
      router.back();
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [token, user, fullName, photoUri, email, initialEmail, setSession, router]);

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

          <CustomButton
            title="Save Changes"
            onPress={handleSave}
            isLoading={saving}
            variant="primary"
          />

          {/* Account Actions Section */}
          <View style={styles.actionsSection}>
            <AppText variant="bodySmall" weight="700" color="#94A3B8" style={styles.actionsSectionTitle}>
              ACCOUNT ACTIONS
            </AppText>

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.85}
              onPress={() => router.push('/profile/change-password' as Href)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(46, 125, 50, 0.08)' }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#2E7D32" />
              </View>
              <View style={styles.actionTextBlock}>
                <AppText variant="body" weight="700" color="#212121">
                  Change Password
                </AppText>
                <AppText variant="caption" color="#64748B">
                  Update your account password
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

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
        cancelLabel="Keep account"
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
  banner: {
    marginBottom: Spacing.md,
  },
  formSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  actionsSection: {
    marginTop: Spacing.xxl,
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

