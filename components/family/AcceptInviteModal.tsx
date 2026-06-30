import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeModal } from '@/components/ui/SafeModal';
import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/AppButton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { activatePetSession } from '@/lib/pet/activatePetSession';
import { formatInviteModules } from '@/lib/family/invitePermissions';
import { rememberSharedPetId } from '@/lib/pet/sharedPetIdsStorage';
import { acceptPetInvite, fetchInviteInfo } from '@/services/family/familyApi';
import type { InviteInfoResponse } from '@/types/family';
import { useQueryClient } from '@tanstack/react-query';

interface AcceptInviteModalProps {
  visible: boolean;
  inviteToken: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AcceptInviteModal({
  visible,
  inviteToken,
  onClose,
  onSuccess,
}: AcceptInviteModalProps) {
  const { token: authToken, user, setSession } = useAuth();
  const { showErrorToast, showSuccessToast } = useToast();
  const queryClient = useQueryClient();

  const [info, setInfo] = useState<InviteInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!visible || !inviteToken) {
      setInfo(null);
      return;
    }

    const loadInfo = async () => {
      setLoading(true);
      try {
        const data = await fetchInviteInfo(inviteToken);
        setInfo(data);
      } catch (err) {
        showErrorToast(getErrorMessage(err));
        onClose();
      } finally {
        setLoading(false);
      }
    };

    void loadInfo();
  }, [visible, inviteToken, showErrorToast, onClose]);

  const handleAccept = async () => {
    if (!inviteToken || !authToken) return;
    
    if (info && !info.valid) {
      showErrorToast('This invitation is no longer valid.');
      return;
    }

    setAccepting(true);
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

      showSuccessToast(`🎉 Congratulations! You are now a family member of ${info?.pet?.name ?? 'this pet'}!`);
      
      // Invalidate queries to refresh the pets lists and current active workspaces
      queryClient.invalidateQueries({ queryKey: ['petsList'] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <AppText variant="h2" weight="900" color={HomeTheme.text} style={styles.title}>
            Family Invitation
          </AppText>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#3A8F3B" size="large" />
              <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.loaderText}>
                Fetching invitation details...
              </AppText>
            </View>
          ) : info ? (
            <View style={styles.infoContainer}>
              <View style={styles.petPhotoContainer}>
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
              </View>

              <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.petName}>
                {info.pet?.name ?? 'Pet'}
              </AppText>
              
              <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.inviterText}>
                Invited by {info.inviterName ?? 'a family member'}
              </AppText>

              {info.permissions?.allowedModules?.length ? (
                <View style={styles.accessWrap}>
                  <AppText variant="caption" weight="700" color={HomeTheme.textMuted} style={styles.accessLabel}>
                    ASSIGNED MODULES
                  </AppText>
                  <AppText variant="caption" weight="800" color={HomeTheme.text} style={styles.accessValues} align="center">
                    {formatInviteModules(info.permissions.allowedModules)}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.btnRow}>
                <CustomButton
                  title={accepting ? "Joining..." : "Accept"}
                  onPress={handleAccept}
                  isLoading={accepting}
                  disabled={!info.valid}
                  style={styles.acceptBtn}
                />
                <CustomButton
                  title="Cancel"
                  onPress={onClose}
                  variant="outline"
                  disabled={accepting}
                  style={styles.cancelBtn}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </SafeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  loaderContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loaderText: {
    marginTop: Spacing.xs,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  petPhotoContainer: {
    width: 90,
    height: 90,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  petPhoto: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    backgroundColor: HomeTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petName: {
    marginBottom: 4,
    textAlign: 'center',
  },
  inviterText: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  accessWrap: {
    width: '100%',
    padding: Spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: 4,
  },
  accessLabel: {
    letterSpacing: 0.8,
  },
  accessValues: {
    textTransform: 'uppercase',
  },
  btnRow: {
    width: '100%',
    gap: Spacing.sm,
  },
  acceptBtn: {
    width: '100%',
    borderRadius: Radius.full,
    height: 48,
  },
  cancelBtn: {
    width: '100%',
    borderRadius: Radius.full,
    height: 48,
  },
});
