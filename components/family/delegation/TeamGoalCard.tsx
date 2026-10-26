import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { FamilyGoalStats } from '@/types/delegation';
import { resolveMediaUrl } from '@/lib/mediaUrl';

interface TeamGoalCardProps {
  stats: FamilyGoalStats | null;
  onEditGoals?: () => void;
  isOwner?: boolean;
}

export function TeamGoalCard({ stats, onEditGoals, isOwner }: TeamGoalCardProps) {
  const weeklyTarget = stats?.walkingGoal?.weeklyTargetMinutes || 150;
  const currentMinutes = stats?.currentWeekStats?.totalMinutesWalked || 0;
  const percent = weeklyTarget > 0 ? Math.min(100, Math.round((currentMinutes / weeklyTarget) * 100)) : 100;
  const contributors = stats?.currentWeekStats?.memberBreakdown || [];

  // SVG circular ring dimensions
  const size = 92;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  return (
    <View style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="paw" size={16} color="#2E7D32" />
          </View>
          <View style={styles.textCol}>
            <AppText variant="body" weight="800" color="#1A2B4E">
              Weekly Walking Goal
            </AppText>
            <AppText variant="caption" color={Palette.gray[600]}>
              Shared family activity target
            </AppText>
          </View>
        </View>

        {isOwner && onEditGoals ? (
          <TouchableOpacity style={styles.editBtn} onPress={onEditGoals} activeOpacity={0.75}>
            <Ionicons name="options-outline" size={14} color="#64748B" />
            <AppText variant="caption" weight="700" color="#64748B">
              Edit
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center Progress Ring & Metrics */}
      <View style={styles.contentRow}>
        {/* Circular SVG Ring */}
        <View style={styles.ringWrapper}>
          <Svg width={size} height={size}>
            {/* Background Track */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Active Progress */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#2E7D32"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          {/* Inner Ring Text */}
          <View style={styles.ringCenterText}>
            <AppText variant="body" weight="800" color="#1A2B4E">
              {percent}%
            </AppText>
            <AppText variant="caption" color={Palette.gray[500]} style={{ fontSize: 9 }}>
              OF GOAL
            </AppText>
          </View>
        </View>

        {/* Metrics Column */}
        <View style={styles.metricsCol}>
          <View style={styles.headlineRow}>
            <AppText variant="h2" weight="800" color="#1A2B4E" style={styles.numberBig}>
              {currentMinutes}
            </AppText>
            <AppText variant="body" color={Palette.gray[600]} style={{ marginBottom: 3 }}>
              {' '}/ {weeklyTarget} mins
            </AppText>
          </View>

          <AppText variant="caption" color={Palette.gray[600]} style={styles.subStatus}>
            {percent >= 100
              ? 'Weekly goal completed!'
              : `${Math.max(0, weeklyTarget - currentMinutes)} mins remaining this week`}
          </AppText>

          {/* Member Contributions */}
          <View style={styles.contributorsRow}>
            {contributors.length > 0 ? (
              contributors.slice(0, 3).map((m, idx) => {
                const media = resolveMediaUrl(m.avatarUrl);
                return (
                  <View key={m.userId || idx} style={styles.contributorChip}>
                    <View style={styles.avatarMini}>
                      {media ? (
                        <Image source={{ uri: media }} style={styles.avatarImg} contentFit="cover" />
                      ) : (
                        <AppText variant="caption" weight="800" color="#184F2E" style={{ fontSize: 10 }}>
                          {m.name.charAt(0).toUpperCase()}
                        </AppText>
                      )}
                    </View>
                    <AppText variant="caption" weight="700" color="#1A2B4E" style={{ fontSize: 11 }}>
                      {m.minutesWalked}m
                    </AppText>
                  </View>
                );
              })
            ) : (
              <AppText variant="caption" color={Palette.gray[500]}>
                Log a walk to record shared progress
              </AppText>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    gap: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsCol: {
    flex: 1,
    gap: 2,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  numberBig: {
    fontSize: 26,
    lineHeight: 30,
  },
  subStatus: {
    lineHeight: 16,
    marginBottom: 4,
  },
  contributorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  contributorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingRight: 8,
    paddingLeft: 3,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  avatarMini: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
});
