import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { HomeTheme, LoginTheme, Radius, Spacing } from '@/constants/theme';

interface FamilyOverviewCardProps {
  familyName: string;
  memberCount: number;
  petCount: number;
  isPremium: boolean;
  joinCode: string | null;
  loadingInvite?: boolean;
  canInvite: boolean;
  showInviteSection?: boolean;
  onShareCode?: () => void;
  onInvitePress?: () => void;
  onEmailInvitePress?: () => void;
  onCreateHubPress?: () => void;
  hasFamilyHub?: boolean;
}

export function FamilyOverviewCard({
  familyName,
  memberCount,
  petCount,
  isPremium,
  joinCode,
  loadingInvite,
  canInvite,
  showInviteSection = true,
  onShareCode,
  onInvitePress,
  onEmailInvitePress,
  onCreateHubPress,
  hasFamilyHub = false,
}: FamilyOverviewCardProps) {
  return (
    <View style={styles.card}>
      {isPremium ? (
        <View style={styles.proBadge}>
          <Ionicons name="star" size={12} color="#F0C419" />
          <AppText variant="caption" weight="700" color="#F0C419" style={styles.proText}>
            Pro
          </AppText>
        </View>
      ) : null}

      <AppText variant="h3" weight="800" color={HomeTheme.white} style={styles.familyName}>
        {familyName}
      </AppText>
      <AppText variant="bodySmall" color="rgba(255,255,255,0.75)" style={styles.stats}>
        {memberCount} active member{memberCount === 1 ? '' : 's'} • {petCount} pet
        {petCount === 1 ? '' : 's'}
      </AppText>

      {showInviteSection ? (
        <>
          <View style={styles.codeBox}>
            <View style={styles.codeTextBlock}>
              <AppText variant="caption" weight="700" color="rgba(255,255,255,0.55)" style={styles.codeLabel}>
                JOIN CODE
              </AppText>
              {loadingInvite ? (
                <ActivityIndicator color={HomeTheme.white} style={styles.codeLoader} />
              ) : (
                <AppText variant="h3" weight="800" color={HomeTheme.white} style={styles.codeValue}>
                  {joinCode ?? '--------'}
                </AppText>
              )}
            </View>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={onShareCode ?? (() => {})}
              disabled={!canInvite || !joinCode || loadingInvite}
              activeOpacity={0.8}
              accessibilityLabel="Share join code"
            >
              <Ionicons name="share-outline" size={20} color={HomeTheme.white} />
            </TouchableOpacity>
          </View>

          <AppButton
            title="Invite via Link / QR"
            onPress={onInvitePress ?? (() => {})}
            disabled={!canInvite || loadingInvite}
            variant="success"
            size="md"
            style={styles.inviteBtn}
            textStyle={styles.inviteBtnText}
            icon={<Ionicons name="link-outline" size={20} color={HomeTheme.white} />}
          />
        </>
      ) : null}

      {showInviteSection && isPremium ? (
        hasFamilyHub ? (
          <AppButton
            title="Invite by Email"
            onPress={onEmailInvitePress ?? (() => {})}
            variant="outline"
            size="md"
            style={styles.emailBtn}
            textStyle={styles.emailBtnText}
            icon={<Ionicons name="mail-outline" size={20} color={HomeTheme.cardGreen} />}
          />
        ) : (
          <AppButton
            title="Set Up Email Family Hub"
            onPress={onCreateHubPress ?? (() => {})}
            variant="outline"
            size="md"
            style={styles.emailBtn}
            textStyle={styles.emailBtnText}
            icon={<Ionicons name="people-outline" size={20} color={HomeTheme.cardGreen} />}
          />
        )
      ) : null}
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  android: { elevation: 6 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: LoginTheme.brandHorizon,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...cardShadow,
  },
  proBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(240,196,25,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  proText: {
    letterSpacing: 0.4,
  },
  familyName: {
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  stats: {
    marginBottom: Spacing.lg,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  codeTextBlock: {
    flex: 1,
  },
  codeLabel: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeValue: {
    letterSpacing: 1.5,
  },
  codeLoader: {
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtn: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 52,
    backgroundColor: HomeTheme.cardGreen,
  },
  inviteBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emailBtn: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 48,
    marginTop: Spacing.sm,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emailBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: HomeTheme.white,
  },
});
