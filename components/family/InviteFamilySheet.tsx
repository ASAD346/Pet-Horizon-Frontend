import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { InviteQrCode } from '@/components/family/InviteQrCode';
import {
  FormSheetShell,
  FormSection,
} from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { SkeletonQRBox } from '@/components/ui/skeletons';
import { getErrorMessage } from '@/lib/api/errors';
import {
  DEFAULT_INVITE_MODULES,
  INVITE_PERMISSION_OPTIONS,
} from '@/lib/family/invitePermissions';
import {
  buildInviteShareMessage,
  resolveInviteAppLink,
  resolveInviteWebLink,
  maskInviteLink,
} from '@/lib/family/inviteLinks';
import { generatePetInvite } from '@/services/family/familyApi';
import type { GenerateInviteResponse } from '@/types/family';

interface InviteFamilySheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  isPremium?: boolean;
  onInviteGenerated?: (invite: GenerateInviteResponse) => void;
}

export function InviteFamilySheet({
  visible,
  onClose,
  petId,
  token,
  isPremium = false,
  onInviteGenerated,
}: InviteFamilySheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<GenerateInviteResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [modules, setModules] = useState<string[]>(DEFAULT_INVITE_MODULES);
  const onInviteGeneratedRef = useRef(onInviteGenerated);
  const requestIdRef = useRef(0);
  const regenerateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onInviteGeneratedRef.current = onInviteGenerated;
  }, [onInviteGenerated]);

  const loadInvite = useCallback(async () => {
    if (!petId || !token) {
      setError('Select a pet before inviting members.');
      setInvite(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const data = await generatePetInvite(token, {
        petId,
        accessLevel: 'edit',
        allowedModules: modules,
      });
      if (requestIdRef.current !== requestId) return;
      setInvite(data);
      onInviteGeneratedRef.current?.(data);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setInvite(null);
      setError(getErrorMessage(err));
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [petId, token, modules]);

  useEffect(() => {
    if (!visible) {
      setCopied(false);
      return;
    }

    setModules(DEFAULT_INVITE_MODULES);
    setInvite(null);
    setError(null);
  }, [visible]);

  useEffect(() => {
    if (!visible || !petId || !token) return;

    if (regenerateTimerRef.current) {
      clearTimeout(regenerateTimerRef.current);
    }

    regenerateTimerRef.current = setTimeout(() => {
      void loadInvite();
    }, 350);

    return () => {
      if (regenerateTimerRef.current) {
        clearTimeout(regenerateTimerRef.current);
      }
    };
  }, [visible, petId, token, modules, loadInvite]);

  const toggleModule = (moduleId: string) => {
    setModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId],
    );
  };

  const appLink = useMemo(
    () => (invite ? resolveInviteAppLink(invite) : null),
    [invite],
  );

  const webLink = useMemo(
    () => (invite ? resolveInviteWebLink(invite) : null),
    [invite],
  );

  const handleCopyLink = async () => {
    if (!webLink) return;
    await Clipboard.setStringAsync(webLink);
    setCopied(true);
  };

  const handleOpenWebLink = async () => {
    if (!webLink) return;
    try {
      await Linking.openURL(webLink);
    } catch {
      Alert.alert('Link', 'Could not open this invitation link.');
    }
  };



  const handleShare = async () => {
    if (!invite || !webLink) return;
    try {
      const message = buildInviteShareMessage(invite, webLink, appLink ?? undefined);
      await Share.share({
        message,
        url: Platform.OS === 'ios' ? webLink : undefined,
      });
    } catch {
      // User dismissed share sheet.
    }
  };

  const activeGreen = isPremium ? '#184F2E' : '#3A8F3B';

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title="Invite Family Member"
      subtitle="Share access with caregivers"
      icon="account-group-outline"
      saveLabel="Send Invitation"
      onSave={handleShare}
      saving={loading}
      saveDisabled={loading || !invite}
      error={error}
      compact
    >
      <FormSection title="Permissions">
        <View style={styles.gridContainer}>
          {INVITE_PERMISSION_OPTIONS.map((option) => {
            const enabled = modules.includes(option.id);
            const activeColor = isPremium ? '#184F2E' : '#3A8F3B';
            const activeBg = isPremium ? '#E8F5E9' : '#EEF8EE';
            const borderColor = enabled ? activeColor : 'rgba(148, 163, 184, 0.15)';
            const backgroundColor = enabled ? activeBg : '#F8FAFC';
            const textColor = enabled ? activeColor : '#475569';
            const iconColor = enabled ? activeColor : '#64748B';

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.permissionChip,
                  {
                    borderColor,
                    backgroundColor,
                  },
                ]}
                onPress={() => toggleModule(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.chipLeft}>
                  <Ionicons name={option.icon} size={16} color={iconColor} />
                  <AppText
                    variant="caption"
                    weight="700"
                    color={textColor}
                    style={styles.chipText}
                    numberOfLines={1}
                  >
                    {option.label}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.checkmarkCircleInline,
                    enabled
                      ? { backgroundColor: activeColor, borderColor: activeColor }
                      : { borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }
                  ]}
                >
                  {enabled && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </FormSection>

      <FormSection title="Invitation Link">
        <AppText variant="caption" color={HomeTheme.textMuted} style={styles.linkHint}>
          Tap the link to open it, or copy/share it directly.
        </AppText>
        <View
          style={[
            styles.linkRow,
            {
              borderColor: isPremium ? 'rgba(24, 79, 46, 0.15)' : 'rgba(92, 179, 93, 0.15)',
              backgroundColor: isPremium ? '#F4F9F4' : '#F0FDF4',
            },
          ]}
        >
          <View style={styles.linkIconWrap}>
            <Ionicons name="link-outline" size={16} color={activeGreen} />
          </View>
          <TouchableOpacity
            style={styles.linkTapArea}
            onPress={handleOpenWebLink}
            disabled={loading || !webLink}
            activeOpacity={0.85}
          >
            <AppText
              variant="bodySmall"
              weight="600"
              color={activeGreen}
              style={styles.linkText}
              numberOfLines={1}
            >
              {loading ? 'Generating link…' : maskInviteLink(webLink)}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.copyBtn,
              { backgroundColor: isPremium ? '#E8F5E9' : '#E8F5E9' },
            ]}
            onPress={handleCopyLink}
            disabled={loading || !webLink}
            activeOpacity={0.85}
          >
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={activeGreen} />
          </TouchableOpacity>
        </View>

        {copied ? (
          <AppText variant="caption" color={activeGreen} style={styles.copiedHint}>
            Link copied — paste in chat (it will be tappable)
          </AppText>
        ) : null}

      </FormSection>

      <FormSection title="Or Scan QR Code">
        <View style={styles.qrWrap}>
          {loading ? (
            <SkeletonQRBox />
          ) : webLink ? (
            <InviteQrCode value={webLink} size={180} />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code-outline" size={48} color={HomeTheme.textMuted} />
            </View>
          )}
        </View>
        <AppText variant="caption" color={HomeTheme.textMuted} style={styles.qrCaption}>
          Scan to open the app and join family
        </AppText>
      </FormSection>
    </FormSheetShell>
  );
}

const styles = StyleSheet.create({
  linkHint: {
    marginBottom: Spacing.xs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingRight: Spacing.xs,
    minHeight: 48,
    marginBottom: Spacing.xs,
  },
  linkIconWrap: {
    paddingLeft: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkTapArea: {
    flex: 1,
    paddingLeft: Spacing.xs,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  copiedHint: {
    marginBottom: Spacing.sm,
  },
  qrWrap: {
    alignSelf: 'center',
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  qrCaption: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: Spacing.xs,
  },
  permissionChip: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    minHeight: 48,
  },
  chipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    marginRight: 4,
  },
  chipText: {
    flex: 1,
    fontSize: 11,
  },
  checkmarkCircleInline: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
