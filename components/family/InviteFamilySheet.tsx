import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { generatePetInvite } from '@/services/family/familyApi';
import type { GenerateInviteResponse } from '@/types/family';

interface InviteFamilySheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  cachedInvite?: GenerateInviteResponse | null;
  onInviteGenerated?: (invite: GenerateInviteResponse) => void;
}

export function InviteFamilySheet({
  visible,
  onClose,
  petId,
  token,
  cachedInvite = null,
  onInviteGenerated,
}: InviteFamilySheetProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<GenerateInviteResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const onInviteGeneratedRef = useRef(onInviteGenerated);
  const requestIdRef = useRef(0);

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
      const data = await generatePetInvite(token, { petId });
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
  }, [petId, token]);

  useEffect(() => {
    if (!visible) {
      setCopied(false);
      return;
    }

    if (cachedInvite?.inviteLink) {
      setInvite(cachedInvite);
      setError(null);
      setLoading(false);
      return;
    }

    loadInvite();
  }, [visible, petId, token, cachedInvite?.inviteLink, cachedInvite?.inviteToken, loadInvite]);

  const handleCopyLink = async () => {
    if (!invite?.inviteLink) return;
    await Clipboard.setStringAsync(invite.inviteLink);
    setCopied(true);
  };

  const handleShare = async () => {
    if (!invite) return;
    try {
      await Share.share({
        message: invite.shareText,
        url: Platform.OS === 'ios' ? invite.inviteLink : undefined,
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
          <View style={styles.linkRow}>
            <AppText variant="bodySmall" color={SheetColors.inputText} style={styles.linkText} numberOfLines={1}>
              {loading ? 'Generating link…' : invite?.inviteLink ?? '—'}
            </AppText>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopyLink}
              disabled={loading || !invite?.inviteLink}
              activeOpacity={0.8}
              accessibilityLabel="Copy invitation link"
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={HomeTheme.cardGreen} />
            </TouchableOpacity>
          </View>
          {copied ? (
            <AppText variant="caption" color={HomeTheme.cardGreen} style={styles.copiedHint}>
              Link copied to clipboard
            </AppText>
          ) : null}

          <SectionLabel text="OR SCAN QR CODE" />
          <View style={styles.qrWrap}>
            {loading ? (
              <ActivityIndicator color={HomeTheme.cardGreen} style={styles.qrLoader} />
            ) : invite?.qrCodeDataUrl ? (
              <Image source={{ uri: invite.qrCodeDataUrl }} style={styles.qrImage} accessibilityLabel="Invitation QR code" />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={48} color={HomeTheme.textMuted} />
              </View>
            )}
          </View>
          <AppText variant="caption" color={HomeTheme.textMuted} style={styles.qrCaption}>
            Scan to join family
          </AppText>

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
  banner: {
    marginBottom: Spacing.sm,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    minHeight: 48,
    marginBottom: Spacing.xs,
  },
  linkText: {
    flex: 1,
    marginRight: Spacing.sm,
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
  qrImage: {
    width: 200,
    height: 200,
  },
  qrLoader: {
    width: 200,
    height: 200,
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
