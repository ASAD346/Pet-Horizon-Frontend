import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AppConfirmModal } from '@/components/ui/AppConfirmModal';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { SkeletonInviteCard } from '@/components/ui/skeletons';
import { getErrorMessage } from '@/lib/api/errors';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { activatePetSession } from '@/lib/pet/activatePetSession';
import { formatInviteModules } from '@/lib/family/invitePermissions';
import { rememberSharedPetId } from '@/lib/pet/sharedPetIdsStorage';
import { acceptPetInvite, fetchInviteInfo } from '@/services/family/familyApi';
import type { InviteInfoResponse } from '@/types/family';

export default function InviteAcceptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const { token: authToken, user, setSession, isAuthenticated } = useAuth();
  const inviteToken = Array.isArray(params.token) ? params.token[0] : params.token;

  const [info, setInfo] = useState<InviteInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Confirmation modal state
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { showErrorToast, showSuccessToast } = useToast();

  const currentUserId = user?._id;
  const invitationCreatorId = info?.invitedBy || info?.creatorId;
  const isOwnInvite = !!(currentUserId && invitationCreatorId && currentUserId === invitationCreatorId);

  const petName = info?.pet?.name ?? 'the pet family';

  const loadInfo = useCallback(async () => {
    if (!inviteToken) {
      showErrorToast('Invalid invitation link.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchInviteInfo(inviteToken);
      setInfo(data);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [inviteToken, showErrorToast]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  useEffect(() => {
    if (loading) return;

    if (isOwnInvite) {
      showErrorToast("You cannot accept your own invitation.");
      router.replace('/(tabs)');
    } else {
      setIsValidating(false);
    }
  }, [loading, isOwnInvite, showErrorToast, router]);

  // Called when "Accept Invitation" button is pressed — opens confirm modal
  const handleAcceptPress = () => {
    if (!inviteToken) return;

    if (!isAuthenticated) {
      router.replace({ pathname: '/auth/login', params: { redirect: `/invite/${inviteToken}` } });
      return;
    }

    if (info && !info.valid) {
      showErrorToast('This invitation is no longer valid.');
      return;
    }

    setConfirmVisible(true);
  };

  // Called when user confirms in the modal
  const handleConfirmAccept = async () => {
    if (!authToken || !inviteToken) return;
    setAccepting(true);
    setConfirmVisible(false);
    try {
      const result = await acceptPetInvite(authToken, inviteToken);
      const joinedPetId = result.petId ?? info?.pet?.petId;

      if (joinedPetId && user?._id) {
        await rememberSharedPetId(user._id, joinedPetId);
        await activatePetSession({
          token: authToken,
          petId: joinedPetId,
          user: user ?? null,
          setSession,
        });
      }

      // 🎉 Success toast then navigate home
      showSuccessToast(`🎉 Congratulations! You are now a family member of ${petName}!`);
      setTimeout(() => router.replace('/(tabs)'), 600);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setAccepting(false);
    }
  };

  if (loading || isValidating) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centeredLoaderContainer}>
          <ActivityIndicator color="#114227" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (isOwnInvite) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" weight="800" color={HomeTheme.text} style={styles.title}>
          Family Invitation
        </AppText>

        {info ? (
          <>
            {!info.valid ? (
              <AuthInfoBanner message="This invitation has expired or was already used." />
            ) : null}

            <View style={styles.card}>
              {info.pet?.photoUrl ? (
                <Image
                  source={{ uri: resolveMediaUrl(info.pet.photoUrl) }}
                  style={styles.petPhoto}
                />
              ) : (
                <View style={[styles.petPhoto, styles.photoFallback]}>
                  <AppText variant="h2">🐾</AppText>
                </View>
              )}
              <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.petName}>
                {info.pet?.name ?? 'Pet'}
              </AppText>
              <AppText variant="bodySmall" color={HomeTheme.textMuted}>
                Invited by {info.inviterName ?? 'a family member'}
              </AppText>
              <AppText variant="caption" color={HomeTheme.textMuted} style={styles.expires}>
                Expires {new Date(info.expiresAt).toLocaleDateString()}
              </AppText>
              {info.permissions?.allowedModules?.length ? (
                <View style={styles.accessWrap}>
                  <AppText variant="caption" weight="700" color={HomeTheme.textMuted} style={styles.accessLabel}>
                    YOU WILL GET ACCESS TO
                  </AppText>
                  <AppText variant="bodySmall" weight="600" color={HomeTheme.text} align="center">
                    {formatInviteModules(info.permissions.allowedModules)}
                  </AppText>
                </View>
              ) : null}
            </View>

            {!isAuthenticated ? (
              <AuthInfoBanner message="Sign in or create an account to accept this invitation." />
            ) : null}

            <CustomButton
              title={isAuthenticated ? 'Accept Invitation' : 'Sign in to Accept'}
              onPress={handleAcceptPress}
              isLoading={accepting}
              disabled={!info.valid}
              style={styles.acceptBtn}
            />
            <CustomButton
              title="Go Back"
              onPress={() => router.back()}
              variant="outline"
              style={styles.backBtn}
            />
          </>
        ) : null}
      </ScrollView>

      {/* Confirmation Modal */}
      <AppConfirmModal
        visible={confirmVisible}
        title="Join Pet Family?"
        message={`You are about to join ${petName}'s care team. You will get access to the assigned care modules. Ready to join?`}
        confirmLabel="Yes, Join Now"
        cancelLabel="Not Now"
        variant="success"
        loading={accepting}
        onConfirm={handleConfirmAccept}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HomeTheme.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  card: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  petPhoto: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  photoFallback: {
    backgroundColor: HomeTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petName: {
    marginBottom: Spacing.xs,
  },
  expires: {
    marginTop: Spacing.sm,
  },
  accessWrap: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8E8',
    width: '100%',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  accessLabel: {
    letterSpacing: 0.8,
  },
  acceptBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: '100%',
    borderRadius: Radius.full,
  },
  centeredLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HomeTheme.background,
  },
});
