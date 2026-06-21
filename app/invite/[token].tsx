import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useAuth } from '@/hooks/useAuth';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { SkeletonInviteCard } from '@/components/ui/skeletons';
import { getErrorMessage } from '@/lib/api/errors';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { formatInviteModules } from '@/lib/family/invitePermissions';
import { acceptPetInvite, fetchInviteInfo } from '@/services/family/familyApi';
import type { InviteInfoResponse } from '@/types/family';

export default function InviteAcceptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const { token: authToken, isAuthenticated } = useAuth();
  const inviteToken = Array.isArray(params.token) ? params.token[0] : params.token;

  const [info, setInfo] = useState<InviteInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    if (!inviteToken) {
      setError('Invalid invitation link.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInviteInfo(inviteToken);
      setInfo(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [inviteToken]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const handleAccept = async () => {
    if (!inviteToken) return;

    if (!isAuthenticated) {
      router.replace({ pathname: '/auth/login', params: { redirect: `/invite/${inviteToken}` } });
      return;
    }

    if (info && !info.valid) {
      setError('This invitation is no longer valid.');
      return;
    }

    if (!authToken) return;
    setAccepting(true);
    setError(null);
    try {
      const result = await acceptPetInvite(authToken, inviteToken);
      Alert.alert('Welcome!', result.message || 'You joined the pet care team.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/community') },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonInviteCard />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" weight="800" color={HomeTheme.text} style={styles.title}>
          Family Invitation
        </AppText>

        {error ? <AuthErrorBanner message={error} /> : null}

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

            <AppButton
              title={isAuthenticated ? 'Accept Invitation' : 'Sign in to Accept'}
              onPress={handleAccept}
              loading={accepting}
              disabled={!info.valid}
              variant="success"
              size="md"
              style={styles.acceptBtn}
            />
            <AppButton
              title="Go Back"
              onPress={() => router.back()}
              variant="outline"
              size="md"
              style={styles.backBtn}
            />
          </>
        ) : null}
      </ScrollView>
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
  loader: {
    marginTop: Spacing.xxl,
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
});
