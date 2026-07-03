import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SkeletonCodeBlock } from '@/components/ui/skeletons';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

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
  // Deep Forest Emerald gradient for Premium with gold trim, vibrant brand green for Free
  const gradientColors = isPremium 
    ? (['#0E331E', '#184F2E', '#226D3F'] as const)
    : (['#2E7D32', '#3D8C40'] as const);

  const shadowColor = isPremium ? '#081D11' : '#1B5E20';
  const borderColor = isPremium ? '#D4A017' : 'rgba(255, 255, 255, 0.15)';
  const themeGreen = isPremium ? '#184F2E' : '#2E7D32';

  const cardShadow = Platform.select({
    ios: {
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  });

  return (
    <View style={[styles.card, { shadowColor, ...cardShadow }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            borderWidth: isPremium ? 1.5 : 1,
            borderColor,
          }
        ]}
      >
        {/* Soft Background Accent Circles */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        {/* Decorative Paw Watermark */}
        <MaterialCommunityIcons name="paw" size={68} color="rgba(255, 255, 255, 0.05)" style={styles.watermark} />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.familyName} ellipsizeMode="tail" numberOfLines={1}>
              {familyName}
            </AppText>
            {isPremium ? (
              <View style={styles.premiumPill}>
                <MaterialCommunityIcons name="crown" size={10} color="#D4A017" style={{ marginRight: 3 }} />
                <AppText weight="800" color="#D4A017" style={styles.pillText}>
                  PREMIUM
                </AppText>
              </View>
            ) : (
              <View style={styles.freePill}>
                <AppText weight="800" color="rgba(255, 255, 255, 0.9)" style={styles.pillText}>
                  FREE PLAN
                </AppText>
              </View>
            )}
          </View>

          <AppText variant="bodySmall" color="rgba(255, 255, 255, 0.8)" style={styles.stats}>
            {memberCount} active member{memberCount === 1 ? '' : 's'} • {petCount} pet
            {petCount === 1 ? '' : 's'}
          </AppText>

          {showInviteSection ? (
            <>
              <View style={styles.codeBox}>
                <View style={styles.codeTextBlock}>
                  <AppText variant="caption" weight="800" color={isPremium ? '#FFF9E6' : 'rgba(255, 255, 255, 0.7)'} style={styles.codeLabel}>
                    INVITATION CODE
                  </AppText>
                  {loadingInvite ? (
                    <SkeletonCodeBlock />
                  ) : joinCode ? (
                    <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.codeValue}>
                      {joinCode}
                    </AppText>
                  ) : (
                    <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={styles.codeEmptyText}>
                      No invite code generated yet
                    </AppText>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={onShareCode ?? (() => {})}
                  disabled={!canInvite || !joinCode || loadingInvite}
                  activeOpacity={0.7}
                  accessibilityLabel="Share join code"
                >
                  <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.inviteBtn,
                  (!canInvite || loadingInvite) && { opacity: 0.6 }
                ]}
                onPress={onInvitePress ?? (() => {})}
                disabled={!canInvite || loadingInvite}
                activeOpacity={0.9}
              >
                <Ionicons name="person-add-outline" size={16} color={themeGreen} />
                <AppText variant="bodySmall" weight="800" color={themeGreen}>
                  Invite Member
                </AppText>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 20,
    padding: 18,
    position: 'relative',
  },
  bgCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: -40,
    right: -30,
  },
  bgCircle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    bottom: -30,
    left: -20,
  },
  watermark: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 1,
  },
  content: {
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  familyName: {
    flex: 1,
    marginRight: Spacing.sm,
    fontSize: 20,
    lineHeight: 26,
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 220, 80, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 220, 80, 0.45)',
  },
  freePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pillText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  stats: {
    marginBottom: Spacing.md,
    opacity: 0.9,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  codeTextBlock: {
    flex: 1,
  },
  codeLabel: {
    letterSpacing: 1,
    marginBottom: 2,
    fontSize: 9,
  },
  codeValue: {
    letterSpacing: 1.5,
    fontSize: 16,
    lineHeight: 20,
  },
  codeEmptyText: {
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.85,
    marginTop: 2,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 44,
  },
});
