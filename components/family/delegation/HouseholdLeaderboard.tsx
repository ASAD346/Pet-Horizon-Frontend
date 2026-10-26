import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { FamilyGoalStats } from '@/types/delegation';
import { resolveMediaUrl } from '@/lib/mediaUrl';

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
      {/* Inspiring Positive Adherence Card */}
      <View style={styles.adherenceBanner}>
        <View style={styles.trophyIconWrap}>
          <Ionicons name="trophy" size={20} color="#D4A017" />
        </View>
        <View style={styles.bannerTextCol}>
          <AppText variant="bodySmall" weight="800" color="#184F2E">
            {familyName} Adherence: {adherence}% 🏆
          </AppText>
          <AppText variant="caption" color={Palette.gray[600]} style={{ lineHeight: 16 }}>
            Wonderful team effort keeping your pet cared for and healthy this week!
          </AppText>
        </View>
      </View>

      {/* Contribution Table Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="ribbon-outline" size={15} color="#184F2E" />
          <AppText variant="caption" weight="800" color="#184F2E" style={styles.headerTitle}>
            FAMILY ACTIVITY & BADGES
          </AppText>
        </View>

        {members.map((member, index) => {
          const isFirst = index === 0 && member.minutesWalked > 0;
          const media = resolveMediaUrl(member.avatarUrl);

          return (
            <View
              key={member.userId || index}
              style={[styles.memberRow, index !== members.length - 1 && styles.rowDivider]}
            >
              <View style={styles.rankWrap}>
                {isFirst ? (
                  <Ionicons name="ribbon" size={20} color="#D4A017" />
                ) : (
                  <AppText variant="caption" weight="800" color={Palette.gray[400]}>
                    #{index + 1}
                  </AppText>
                )}
              </View>

              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {media ? (
                  <Image source={{ uri: media }} style={styles.avatarImg} contentFit="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <AppText variant="caption" weight="800" color="#184F2E">
                      {member.name.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Member Details */}
              <View style={styles.memberInfo}>
                <AppText variant="bodySmall" weight="800" color={Palette.gray[900]}>
                  {member.name}
                </AppText>
                <View style={styles.badgeRow}>
                  <View style={styles.badgeChip}>
                    <AppText variant="caption" weight="700" color="#184F2E" style={{ fontSize: 10 }}>
                      {member.badge || 'Care Champion 🐾'}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.metricWrap}>
                {member.minutesWalked > 0 ? (
                  <AppText variant="bodySmall" weight="800" color="#184F2E">
                    {member.minutesWalked} mins
                  </AppText>
                ) : (
                  <AppText variant="bodySmall" weight="800" color="#184F2E">
                    {member.totalTasksCount} tasks
                  </AppText>
                )}
                <AppText variant="caption" color={Palette.gray[500]} style={{ fontSize: 11 }}>
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
  adherenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 18,
    padding: Spacing.md,
  },
  trophyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  bannerTextCol: {
    flex: 1,
    gap: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: '#F8FAF8',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    letterSpacing: 0.5,
    fontSize: 11,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.md - 2,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rankWrap: {
    width: 22,
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
    backgroundColor: '#E8F5E9',
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
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  metricWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
