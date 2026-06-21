import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { InviteQrCode } from '@/components/family/InviteQrCode';
import { SectionLabel, SheetColors } from '@/components/sheets';
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
} from '@/lib/family/inviteLinks';
import { generatePetInvite } from '@/services/family/familyApi';
import type { GenerateInviteResponse } from '@/types/family';

interface InviteFamilySheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onInviteGenerated?: (invite: GenerateInviteResponse) => void;
}

export function InviteFamilySheet({
  visible,
  onClose,
  petId,
  token,
  onInviteGenerated,
}: InviteFamilySheetProps) {
  const insets = useSafeAreaInsets();
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

  const handleOpenAppLink = async () => {
    if (!appLink) return;
    try {
      const supported = await Linking.canOpenURL(appLink);
      if (!supported) {
        Alert.alert(
          'Pet Horizon',
          'Install the Pet Horizon app first, then try again.',
        );
        return;
      }
      await Linking.openURL(appLink);
    } catch {
      Alert.alert('Pet Horizon', 'Could not open the app. Make sure Pet Horizon is installed.');
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={SheetColors.title} style={styles.headerTitle}>
              Invite Family Member
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={HomeTheme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionLabel text="SET PERMISSIONS FOR INVITE" />

            {INVITE_PERMISSION_OPTIONS.map((option) => {
              const enabled = modules.includes(option.id);
              return (
                <View key={option.id} style={styles.permissionRow}>
                  <View style={styles.permissionLeft}>
                    <View style={styles.permissionIconWrap}>
                      <Ionicons name={option.icon} size={18} color={HomeTheme.cardGreen} />
                    </View>
                    <AppText variant="bodySmall" weight="600" color={HomeTheme.text}>
                      {option.label}
                    </AppText>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={() => toggleModule(option.id)}
                    trackColor={{ false: '#E5E7EB', true: HomeTheme.cardGreen }}
                    thumbColor={HomeTheme.white}
                    ios_backgroundColor="#E5E7EB"
                  />
                </View>
              );
            })}

            {error ? (
              <View style={styles.banner}>
                <AuthErrorBanner message={error} />
                <TouchableOpacity style={styles.retryBtn} onPress={loadInvite} activeOpacity={0.8}>
                  <AppText variant="bodySmall" weight="700" color={HomeTheme.cardGreen}>
                    Try again
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : null}

            <SectionLabel text="SHARE INVITATION LINK" />
            <AppText variant="caption" color={HomeTheme.textMuted} style={styles.linkHint}>
              Tap the link to open it. Share the https link — it works in WhatsApp and messages.
            </AppText>
            <View style={styles.linkRow}>
              <TouchableOpacity
                style={styles.linkTapArea}
                onPress={handleOpenWebLink}
                disabled={loading || !webLink}
                activeOpacity={0.85}
                accessibilityRole="link"
                accessibilityLabel="Open invitation link"
              >
                <AppText
                  variant="bodySmall"
                  weight="600"
                  color={HomeTheme.cardGreen}
                  style={styles.linkText}
                  numberOfLines={2}
                >
                  {loading ? 'Generating link…' : webLink ?? '—'}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyLink}
                disabled={loading || !webLink}
                activeOpacity={0.8}
                accessibilityLabel="Copy invitation link"
              >
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={HomeTheme.cardGreen} />
              </TouchableOpacity>
            </View>
            {copied ? (
              <AppText variant="caption" color={HomeTheme.cardGreen} style={styles.copiedHint}>
                Link copied — paste in chat (it will be tappable)
              </AppText>
            ) : null}

            {appLink ? (
              <TouchableOpacity
                style={styles.openAppBtn}
                onPress={handleOpenAppLink}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={18} color={HomeTheme.cardGreen} />
                <AppText variant="bodySmall" weight="700" color={HomeTheme.cardGreen}>
                  Open directly in Pet Horizon app
                </AppText>
              </TouchableOpacity>
            ) : null}

            <SectionLabel text="OR SCAN QR CODE" />
            <View style={styles.qrWrap}>
              {loading ? (
                <SkeletonQRBox />
              ) : webLink ? (
                <InviteQrCode value={webLink} size={200} />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={48} color={HomeTheme.textMuted} />
                </View>
              )}
            </View>
            <AppText variant="caption" color={HomeTheme.textMuted} style={styles.qrCaption}>
              Scan to open the app and join family
            </AppText>
          </ScrollView>

          <AppButton
            title="Send Invitation"
            onPress={handleShare}
            disabled={loading || !invite}
            variant="success"
            size="md"
            style={styles.shareBtn}
            textStyle={styles.shareBtnText}
            icon={<Ionicons name="share-social-outline" size={20} color={HomeTheme.white} />}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  permissionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    marginBottom: Spacing.sm,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  linkHint: {
    marginBottom: Spacing.xs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8EE',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(92, 179, 93, 0.25)',
    paddingRight: Spacing.xs,
    minHeight: 48,
    marginBottom: Spacing.xs,
  },
  linkTapArea: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  openAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  copyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiedHint: {
    marginBottom: Spacing.sm,
  },
  qrWrap: {
    alignSelf: 'center',
    backgroundColor: HomeTheme.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCaption: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  shareBtn: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 52,
    marginBottom: Spacing.sm,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
