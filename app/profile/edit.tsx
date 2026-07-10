import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
import { uploadUserAvatar } from '@/services/users/uploadUserAvatar';
import { AppInput } from '@/components/ui/AppInput';

export default function EditProfileScreen() {
  const router = useRouter();
  const { token, user, setSession } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
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
});
