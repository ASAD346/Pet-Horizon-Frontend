import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { SkeletonCodeBlock } from '@/components/ui/skeletons';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

// Free plan: vibrant brand green
const FREE_GRAD: readonly [string, string] = ['#3A8F3B', '#5CB35D'];
const FREE_SHADOW = '#1B5E20';

// Premium plan: dark luxurious emerald
const PREM_GRAD: readonly [string, string, string] = ['#0E3821', '#184F2E', '#267343'];
const PREM_SHADOW = '#082113';

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
}: FamilyOverviewCardProps) {
  const gradientColors = isPremium ? PREM_GRAD : FREE_GRAD;
  const shadowColor = isPremium ? PREM_SHADOW : FREE_SHADOW;

  // Premium style overrides
  const codeBoxBg = isPremium ? 'rgba(212,160,23,0.12)' : 'rgba(0,0,0,0.18)';
  const codeBoxBorderColor = isPremium ? 'rgba(212,160,23,0.3)' : 'rgba(255,255,255,0.15)';

  return (
    <View style={[styles.wrapper, { shadowColor }]}>
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative background rings */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.bgRing1} />
          <View style={styles.bgRing2} />
        </View>

        {isPremium ? (
          <View style={styles.proBadge}>
            <Ionicons name="star" size={11} color="#FFD700" style={styles.proStar} />
            <AppText variant="caption" weight="800" color="#FFFFFF" style={styles.proText}>
              PREMIUM
            </AppText>
          </View>
        ) : null}

        <AppText variant="h3" weight="800" color={HomeTheme.white} style={styles.familyName}>
          {familyName}
        </AppText>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.85)" style={styles.stats}>
          {memberCount} active member{memberCount === 1 ? '' : 's'} • {petCount} pet
          {petCount === 1 ? '' : 's'}
        </AppText>

        {showInviteSection ? (
          <>
            <View style={[styles.codeBox, { backgroundColor: codeBoxBg, borderColor: codeBoxBorderColor }]}>
              <View style={styles.codeTextBlock}>
                <AppText variant="caption" weight="700" color="rgba(255,255,255,0.7)" style={styles.codeLabel}>
                  JOIN CODE
                </AppText>
                {loadingInvite ? (
                  <SkeletonCodeBlock />
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
              title="Invite Member"
              onPress={onInvitePress ?? (() => {})}
              disabled={!canInvite || loadingInvite}
              variant="success"
              size="md"
              style={[styles.inviteBtn, isPremium && styles.inviteBtnPremium]}
              textStyle={styles.inviteBtnText}
              icon={<Ionicons name="person-add-outline" size={18} color={isPremium ? '#D4A017' : HomeTheme.white} />}
            />
          </>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  bgRing1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -80,
    right: -60,
  },
  bgRing2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -30,
  },
  proBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  proStar: {
    marginTop: -1,
  },
  proText: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  familyName: {
    marginTop: Spacing.xs,
    marginBottom: 4,
    fontSize: 20,
  },
  stats: {
    marginBottom: Spacing.lg,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  codeTextBlock: {
    flex: 1,
  },
  codeLabel: {
    letterSpacing: 1,
    marginBottom: 4,
    fontSize: 10,
  },
  codeValue: {
    letterSpacing: 1.5,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  inviteBtnPremium: {
    backgroundColor: 'rgba(212,160,23,0.18)',
    borderColor: 'rgba(212,160,23,0.4)',
  },
  inviteBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
