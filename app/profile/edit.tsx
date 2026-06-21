import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { PetPhotoPicker } from '@/components/pet';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { getErrorMessage } from '@/lib/api/errors';
import {
  requestEmailChange,
  updateUserProfile,
  verifyEmailChange,
} from '@/services/users/userApi';
import { uploadUserAvatar } from '@/services/users/uploadUserAvatar';

export default function EditProfileScreen() {
  const router = useRouter();
  const { token, user, setSession } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | undefined>();
  const [emailOtp, setEmailOtp] = useState('');
  const [emailChangePending, setEmailChangePending] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? '');
    setEmail(user.email);
    setInitialEmail(user.email);
    setExistingPhotoUrl(resolveMediaUrl(user.profileImage));
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!token || !user?._id) {
      setError('Please log in again.');
      return;
    }

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Full name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let nextUser = user;

      if (trimmedName !== (user.fullName ?? '')) {
        nextUser = await updateUserProfile(token, user._id, { fullName: trimmedName });
      }

      const localPhoto = photoUri && !photoUri.startsWith('http') ? photoUri : null;
      if (localPhoto) {
        nextUser = await uploadUserAvatar(token, localPhoto);
      }

      const emailChanged =
        email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();

      if (emailChanged && !emailChangePending) {
        const response = await requestEmailChange(token, email.trim());
        setEmailChangePending(true);
        setDevOtpHint(response.devOtp ? `Dev code: ${response.devOtp}` : null);
        setError(null);
        Alert.alert(
          'Verify new email',
          `${response.message}${response.devOtp ? `\n\nDev code: ${response.devOtp}` : ''}`,
        );
        await setSession({ token, user: nextUser });
        setSaving(false);
        return;
      }

      if (emailChangePending && emailOtp.trim()) {
        await verifyEmailChange(token, emailOtp.trim());
        nextUser = { ...nextUser, email: email.trim().toLowerCase() };
        setInitialEmail(email.trim().toLowerCase());
        setEmailChangePending(false);
        setEmailOtp('');
        setDevOtpHint(null);
      }

      await setSession({ token, user: nextUser });
      Alert.alert('Profile updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [
    token,
    user,
    fullName,
    photoUri,
    email,
    initialEmail,
    emailChangePending,
    emailOtp,
    setSession,
    router,
  ]);

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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.photoSection}>
            <PetPhotoPicker
              imageUri={displayPhoto}
              onImageChange={(uri) => setPhotoUri(uri)}
            />
            <AppText variant="caption" color={ProfileTheme.textMuted} style={styles.photoHint}>
              Tap the camera to change photo
            </AppText>
          </View>

          {error ? <AuthErrorBanner message={error} /> : null}
          {devOtpHint ? <AuthInfoBanner message={devOtpHint} /> : null}

          <SectionLabel text="FULL NAME" />
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color={HomeTheme.textMuted} />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={SheetColors.placeholder}
              style={styles.input}
              autoCapitalize="words"
            />
          </View>

          <SectionLabel text="EMAIL ADDRESS" />
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={HomeTheme.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={SheetColors.placeholder}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {emailChangePending ? (
            <>
              <SectionLabel text="EMAIL VERIFICATION CODE" />
              <TextInput
                value={emailOtp}
                onChangeText={setEmailOtp}
                placeholder="Enter code from email"
                placeholderTextColor={SheetColors.placeholder}
                style={styles.otpInput}
                keyboardType="number-pad"
              />
            </>
          ) : null}

          <AppButton
            title="Update Profile"
            onPress={handleSave}
            loading={saving}
            variant="primary"
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
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  photoHint: {
    marginTop: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: SheetColors.inputText,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  otpInput: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 14,
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  submitBtn: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 52,
    marginTop: Spacing.md,
    backgroundColor: ProfileTheme.navy,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
