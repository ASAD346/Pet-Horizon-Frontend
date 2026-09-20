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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
      <FormSection title="Permissions" icon="shield-account-outline">
        <View style={styles.permissionsHeaderRow}>
          <AppText variant="caption" color={HomeTheme.textMuted} style={styles.permissionsCountText}>
            {modules.length === INVITE_PERMISSION_OPTIONS.length
              ? 'All permissions active'
              : `${modules.length} of ${INVITE_PERMISSION_OPTIONS.length} active`}
          </AppText>
          <TouchableOpacity
            onPress={() => {
              if (modules.length === INVITE_PERMISSION_OPTIONS.length) {
                setModules([]);
              } else {
                setModules(INVITE_PERMISSION_OPTIONS.map((o) => o.id));
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppText variant="caption" weight="700" color={activeGreen}>
              {modules.length === INVITE_PERMISSION_OPTIONS.length ? 'Clear All' : 'Select All'}
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {INVITE_PERMISSION_OPTIONS.map((option) => {
            const enabled = modules.includes(option.id);
            const activeColor = isPremium ? '#166534' : '#15803D';
            const borderColor = enabled ? (isPremium ? '#166534' : '#22C55E') : '#E2E8F0';
            const backgroundColor = enabled ? '#F0FDF4' : '#FFFFFF';
            const textColor = enabled ? '#0F172A' : '#475569';
            const iconBg = enabled ? '#DCFCE7' : '#F1F5F9';
            const iconColor = enabled ? activeColor : '#64748B';

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.permissionCard,
                  {
                    borderColor,
                    backgroundColor,
                  },
                  enabled && styles.permissionCardActive,
                ]}
                onPress={() => toggleModule(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                  <MaterialCommunityIcons name={option.icon} size={18} color={iconColor} />
                </View>

                <View style={styles.labelCol}>
                  <AppText
                    variant="caption"
                    weight="700"
                    color={textColor}
                    style={styles.cardLabel}
                    numberOfLines={2}
                  >
                    {option.label}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.checkCircle,
                    enabled
                      ? { backgroundColor: activeColor, borderColor: activeColor }
                      : { borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
                  ]}
                >
                  {enabled && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={15} color="#0284C7" />
          <AppText style={styles.infoText}>
            Journal and Expenses access is included automatically.
          </AppText>
        </View>
      </FormSection>

      <FormSection title="Invitation Link" icon="link-variant">
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

      <FormSection title="Or Scan QR Code" icon="qrcode-scan">
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
  permissionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  permissionsCountText: {
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  permissionCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    minHeight: 52,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  permissionCardActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelCol: {
    flex: 1,
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 12,
    lineHeight: 15,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
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
});
