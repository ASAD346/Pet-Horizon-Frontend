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
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { PetPhotoPicker } from '@/components/pet';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { SectionLabel, SheetColors } from '@/components/sheets';
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

import { homeCardShadow } from '@/components/home/homeStyles';

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
  const { showToast, showErrorToast } = useToast();

  // Active input state for gorgeous focus effects
  const [activeField, setActiveField] = useState<'name' | 'email' | 'otp' | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? '');
    setEmail(user.email);
    setInitialEmail(user.email);
    setExistingPhotoUrl(resolveMediaUrl(user.profileImage));
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!token || !user?._id) {
      showErrorToast('Please log in again.');
      return;
    }

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      showErrorToast('Full name is required.');
      return;
    }

    setSaving(true);

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
      showToast('Profile updated successfully!');
      router.back();
    } catch (err) {
      showErrorToast(getErrorMessage(err));
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Avatar / Photo picker with premium layout */}
          <View style={styles.avatarCard}>
            <View style={styles.photoContainer}>
              <PetPhotoPicker
                imageUri={displayPhoto}
                onImageChange={(uri) => setPhotoUri(uri)}
              />
            </View>
            <AppText variant="bodySmall" weight="700" color={ProfileTheme.green} style={styles.photoHint}>
              Change Profile Photo
            </AppText>
            <AppText variant="caption" color={ProfileTheme.textMuted} style={styles.photoSubhint}>
              Tap the circular badge above to upload or take a new picture
            </AppText>
          </View>
          {devOtpHint ? <View style={styles.banner}><AuthInfoBanner message={devOtpHint} /></View> : null}

          {/* Form container */}
          <View style={styles.formCard}>
            {/* Full Name input */}
            <View style={styles.labelContainer}>
              <View style={[styles.labelDot, activeField === 'name' && styles.labelDotActive]} />
              <AppText variant="caption" weight="800" color={activeField === 'name' ? '#2E7D32' : '#64748B'} style={styles.labelText}>
                FULL NAME
              </AppText>
            </View>
            <View style={[
              styles.inputRow,
              activeField === 'name' && styles.inputRowActive
            ]}>
              <Ionicons 
                name="person-outline" 
                size={18} 
                color={activeField === 'name' ? '#2E7D32' : '#94A3B8'} 
              />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor={SheetColors.placeholder}
                style={styles.input}
                autoCapitalize="words"
                onFocus={() => setActiveField('name')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Email input */}
            <View style={styles.labelContainer}>
              <View style={[styles.labelDot, activeField === 'email' && styles.labelDotActive]} />
              <AppText variant="caption" weight="800" color={activeField === 'email' ? '#2E7D32' : '#64748B'} style={styles.labelText}>
                EMAIL ADDRESS
              </AppText>
            </View>
            <View style={[
              styles.inputRow,
              activeField === 'email' && styles.inputRowActive
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={18} 
                color={activeField === 'email' ? '#2E7D32' : '#94A3B8'} 
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={SheetColors.placeholder}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setActiveField('email')}
                onBlur={() => setActiveField(null)}
              />
            </View>

            {/* Email OTP code input if pending */}
            {emailChangePending ? (
              <>
                <View style={styles.labelContainer}>
                  <View style={[styles.labelDot, activeField === 'otp' && styles.labelDotActive]} />
                  <AppText variant="caption" weight="800" color={activeField === 'otp' ? '#2E7D32' : '#64748B'} style={styles.labelText}>
                    EMAIL VERIFICATION CODE
                  </AppText>
                </View>
                <View style={[
                  styles.inputRow,
                  activeField === 'otp' && styles.inputRowActive
                ]}>
                  <Ionicons 
                    name="key-outline" 
                    size={18} 
                    color={activeField === 'otp' ? '#2E7D32' : '#94A3B8'} 
                  />
                  <TextInput
                    value={emailOtp}
                    onChangeText={setEmailOtp}
                    placeholder="Enter verification code"
                    placeholderTextColor={SheetColors.placeholder}
                    style={styles.input}
                    keyboardType="number-pad"
                    onFocus={() => setActiveField('otp')}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </>
            ) : null}
          </View>

          <AppButton
            title="Save Changes"
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...homeCardShadow,
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  photoHint: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  photoSubhint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: Spacing.lg,
  },
  banner: {
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.lg,
    ...homeCardShadow,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 48,
  },
  inputRowActive: {
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
  input: {
    flex: 1,
    fontSize: 14,
    color: SheetColors.inputText,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  submitBtn: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 52,
    marginTop: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#1B5E20',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
