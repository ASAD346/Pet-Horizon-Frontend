import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { FamilyGoalStats } from '@/types/delegation';

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
  const size = 88;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0E331E', '#184F2E', '#226D3F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <View style={styles.proBadge}>
              <Ionicons name="sparkles" size={12} color="#D4A017" />
              <AppText variant="caption" weight="800" color="#D4A017">
                PRO TEAM GOAL
              </AppText>
            </View>
            <AppText variant="bodySmall" weight="800" color="#FFFFFF">
              Weekly Household Walking
            </AppText>
          </View>
          {isOwner && onEditGoals ? (
            <TouchableOpacity style={styles.editBtn} onPress={onEditGoals} activeOpacity={0.7}>
              <Ionicons name="options-outline" size={16} color="rgba(255, 255, 255, 0.85)" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Main Goal Progress View */}
        <View style={styles.progressSection}>
          <View style={styles.ringWrapper}>
            <Svg width={size} height={size}>
              {/* Background Track */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Active Progress */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#D4A017"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={styles.centerTextContainer}>
              <AppText variant="body" weight="800" color="#FFFFFF">
                {percent}%
              </AppText>
            </View>
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metricRow}>
              <AppText variant="h3" weight="800" color="#FFFFFF">
                {currentMinutes}
              </AppText>
              <AppText variant="bodySmall" color="rgba(255, 255, 255, 0.7)">
                {' '}/ {weeklyTarget} mins
              </AppText>
            </View>
            <AppText variant="caption" color="rgba(255, 255, 255, 0.85)">
              {percent >= 100
                ? '🎉 Weekly goal completed!'
                : `${weeklyTarget - currentMinutes} mins remaining this week`}
            </AppText>

            {/* Overlapping member avatars */}
            <View style={styles.avatarsRow}>
              {contributors.length > 0 ? (
                contributors.slice(0, 4).map((member, idx) => (
                  <View
                    key={member.userId || idx}
                    style={[styles.avatarWrap, { marginLeft: idx > 0 ? -10 : 0 }]}
                  >
                    {member.avatarUrl ? (
                      <Image source={{ uri: member.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <AppText variant="caption" weight="800" color="#184F2E">
                          {member.name?.charAt(0)?.toUpperCase() || 'M'}
                        </AppText>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <AppText variant="caption" color="rgba(255, 255, 255, 0.6)">
                  Log a walk to record household progress
                </AppText>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4A017',
    ...Platform.select({
      ios: {
        shadowColor: '#0E331E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  gradient: {
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleWrap: {
    gap: 2,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 160, 23, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  editBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 4,
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsContainer: {
    flex: 1,
    gap: 3,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatarWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
