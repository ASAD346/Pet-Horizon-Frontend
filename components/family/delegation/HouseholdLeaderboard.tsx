import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { FamilyGoalStats, MemberContribution } from '@/types/delegation';

interface HouseholdLeaderboardProps {
  stats: FamilyGoalStats | null;
  familyName?: string;
}

export function HouseholdLeaderboard({ stats, familyName = 'Household' }: HouseholdLeaderboardProps) {
  const members = stats?.currentWeekStats?.memberBreakdown || [];
  const adherence = stats?.currentWeekStats?.adherencePercentage ?? 95;

  if (members.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Positive Header Banner */}
      <View style={styles.banner}>
        <Ionicons name="trophy" size={20} color="#D4A017" />
        <View style={styles.bannerTextWrap}>
          <AppText variant="bodySmall" weight="800" color="#1A2B4E">
            {familyName} Care Adherence: {adherence}% 🏆
          </AppText>
          <AppText variant="caption" color={Palette.gray[600]}>
            Great job keeping Milo healthy and happy together this week!
          </AppText>
        </View>
      </View>

      {/* Leaderboard List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText variant="caption" weight="800" color={Palette.gray[500]} style={{ letterSpacing: 0.5 }}>
            THIS WEEK'S CONTRIBUTIONS
          </AppText>
        </View>

        {members.map((member, index) => {
          const isFirst = index === 0 && member.minutesWalked > 0;
          return (
            <View
              key={member.userId || index}
              style={[styles.memberRow, index !== members.length - 1 && styles.rowDivider]}
            >
              <View style={styles.rankWrap}>
                {isFirst ? (
                  <Ionicons name="ribbon" size={20} color="#D4A017" />
                ) : (
                  <AppText variant="caption" weight="800" color={Palette.gray[500]}>
                    #{index + 1}
                  </AppText>
                )}
              </View>

              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {member.avatarUrl ? (
                  <Image source={{ uri: member.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <AppText variant="caption" weight="800" color={Palette.primary.base}>
                      {member.name.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Member Details */}
              <View style={styles.memberInfo}>
                <AppText variant="bodySmall" weight="700" color={Palette.gray[900]}>
                  {member.name}
                </AppText>
                <View style={styles.badgeRow}>
                  <View style={styles.badgeChip}>
                    <AppText variant="caption" weight="700" color="#184F2E">
                      {member.badge || 'Care Champion 🐾'}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Metric stats */}
              <View style={styles.metricWrap}>
                {member.minutesWalked > 0 ? (
                  <AppText variant="bodySmall" weight="800" color={Palette.primary.base}>
                    {member.minutesWalked} min
                  </AppText>
                ) : (
                  <AppText variant="bodySmall" weight="800" color={Palette.primary.base}>
                    {member.totalTasksCount} tasks
                  </AppText>
                )}
                <AppText variant="caption" color={Palette.gray[500]}>
                  {member.walksCount} walks • {member.feedingsCount} feeds
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  bannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rankWrap: {
    width: 24,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 36,
    height: 36,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgeChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  metricWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
