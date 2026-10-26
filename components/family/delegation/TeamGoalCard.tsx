import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const size = 96;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={['#0E3821', '#184F2E', '#267343']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Subtle decorative background rings matching FamilyHubHeader */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.bgRing1} />
          <View style={styles.bgRing2} />
        </View>

        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={styles.proBadge}>
              <Ionicons name="sparkles" size={11} color="#D4A017" />
              <AppText variant="caption" weight="800" color="#D4A017" style={styles.proBadgeText}>
                PRO WALKING GOAL
              </AppText>
            </View>
            <AppText variant="caption" color="rgba(255, 255, 255, 0.75)">
              Weekly Household Target
            </AppText>
          </View>

          {isOwner && onEditGoals ? (
            <TouchableOpacity style={styles.editBtn} onPress={onEditGoals} activeOpacity={0.75}>
              <Ionicons name="options-outline" size={15} color="#FFFFFF" />
              <AppText variant="caption" weight="700" color="#FFFFFF">
                Edit Goal
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Center Progress Ring & Key Metrics */}
        <View style={styles.contentRow}>
          {/* Circular SVG Ring */}
          <View style={styles.ringWrapper}>
            <Svg width={size} height={size}>
              {/* Background Track */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.16)"
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

            {/* Inner Ring Text */}
            <View style={styles.ringCenterText}>
              <AppText variant="h3" weight="800" color="#FFFFFF">
                {percent}%
              </AppText>
              <AppText variant="caption" color="rgba(255, 255, 255, 0.7)" style={{ fontSize: 9 }}>
                REACHED
              </AppText>
            </View>
          </View>

          {/* Metrics Description */}
          <View style={styles.metricsCol}>
            <View style={styles.headlineRow}>
              <AppText variant="h2" weight="800" color="#FFFFFF" style={styles.numberBig}>
                {currentMinutes}
              </AppText>
              <AppText variant="body" color="rgba(255, 255, 255, 0.75)" style={{ marginBottom: 4 }}>
                {' '}/ {weeklyTarget} mins
              </AppText>
            </View>

            <AppText variant="caption" color="rgba(255, 255, 255, 0.85)" style={styles.subStatus}>
              {percent >= 100
                ? '🏆 Weekly household milestone achieved!'
                : `${Math.max(0, weeklyTarget - currentMinutes)} mins to reach team goal`}
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
                      <AppText variant="caption" weight="700" color="#FFFFFF" style={{ fontSize: 11 }}>
                        {m.minutesWalked}m
                      </AppText>
                    </View>
                  );
                })
              ) : (
                <AppText variant="caption" color="rgba(255, 255, 255, 0.65)">
                  Log a walk to record shared progress
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
  cardWrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.35)', // subtle gold trim
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  gradient: {
    padding: Spacing.md + 2,
    position: 'relative',
    overflow: 'hidden',
  },
  bgRing1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 28,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    top: -80,
    right: -60,
  },
  bgRing2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 18,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    bottom: -40,
    left: -20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    gap: 3,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 160, 23, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderColor: 'rgba(212, 160, 23, 0.4)',
  },
  proBadgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 2,
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
    fontSize: 28,
    lineHeight: 32,
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
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingRight: 8,
    paddingLeft: 3,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
});
