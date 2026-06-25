import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonCodeBlock } from '@/components/ui/skeletons';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';

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
  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <AppText variant="h3" weight="800" color={Colors.text} style={styles.familyName}>
          {familyName}
        </AppText>
        {isPremium ? (
          <StatusBadge status="premium" />
        ) : (
          <StatusBadge status="active" label="Free Plan" />
        )}
      </View>

      <AppText variant="bodySmall" color={Colors.textMuted} style={styles.stats}>
        {memberCount} active member{memberCount === 1 ? '' : 's'} • {petCount} pet
        {petCount === 1 ? '' : 's'}
      </AppText>

      {showInviteSection ? (
        <>
          <View style={styles.codeBox}>
            <View style={styles.codeTextBlock}>
              <AppText variant="caption" weight="800" color={Colors.textLight} style={styles.codeLabel}>
                JOIN CODE
              </AppText>
              {loadingInvite ? (
                <SkeletonCodeBlock />
              ) : (
                <AppText variant="h3" weight="800" color={Colors.text} style={styles.codeValue}>
                  {joinCode ?? '--------'}
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
              <Ionicons name="share-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <PrimaryButton
            title="Invite Member"
            onPress={onInvitePress ?? (() => {})}
            disabled={!canInvite || loadingInvite}
            size="md"
            icon={<Ionicons name="person-add-outline" size={18} color="#FFFFFF" />}
          />
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  familyName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  stats: {
    marginBottom: Spacing.md,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
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
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
