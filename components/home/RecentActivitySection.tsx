import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AppText } from '../ui/AppText';
import { EmptyState } from '../ui/EmptyState';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { HomeTheme, Spacing } from '../../constants/theme';

export interface RecentActivityItem {
  id: string;
  actorName: string;
  actionText: string;
  time: string;
  icon: 'walk' | 'silverware-fork-knife' | 'pill' | 'content-cut' | 'needle';
  color: string;
  bg: string;
  /** ISO date string used to filter today-only on home screen */
  createdAt?: string;
}

interface RecentActivitySectionProps {
  activities?: RecentActivityItem[];
  isPremium?: boolean;
  onViewAll?: () => void;
  /** When true, only show activities from today (home screen mode) */
  todayOnly?: boolean;
}

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return true; // pass-through if no date info
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatRawString(text: string) {
  if (!text) return '';
  return text
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export const RecentActivitySection = React.memo(function RecentActivitySection({
  activities = [],
  isPremium = false,
  onViewAll,
  todayOnly = true,
}: RecentActivitySectionProps) {
  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  const iconColor = isPremium ? '#184F2E' : '#2E7D32';
  const iconBg = isPremium ? 'rgba(212, 160, 23, 0.08)' : 'rgba(46, 125, 50, 0.06)';

  // Filter to today-only when on the home screen
  const visibleActivities = todayOnly
    ? activities.filter((a) => isToday(a.createdAt))
    : activities;

  return (
    <View style={styles.section}>
      <SectionHeader title="Recent Activity" actionLabel="VIEW ALL" onActionPress={onViewAll} />
      {visibleActivities.length === 0 ? (
        <View style={{ marginVertical: Spacing.xs }}>
          <EmptyState
            icon="lightning-bolt-outline"
            title="Nothing logged yet today"
            description="Mark a feeding, walk, or medication as done and it will show up here."
          />
        </View>
      ) : (
        visibleActivities.map((item) => (
          <View key={item.id} style={[homePillCard.card, { borderWidth: 1, borderColor: cardBorderColor }]}>
            <ColorIconBadge
              color={iconColor}
              backgroundColor={iconBg}
              materialIcon={item.icon}
              size={44}
              iconSize={22}
              style={styles.iconBadge}
            />
            <View style={styles.textBlock}>
              <AppText variant="bodySmall">
                <Text style={{ fontWeight: 'bold', color: HomeTheme.text }}>
                  {item.actorName}
                </Text>
                <Text style={{ color: HomeTheme.textMuted }}>
                  {' '}{formatRawString(item.actionText)}
                </Text>
              </AppText>
              <AppText variant="caption" color={HomeTheme.textMuted}>
                {item.time}
              </AppText>
            </View>
          </View>
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  emptyCard: {
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    alignSelf: 'center',
  },
  iconBadge: {
    alignSelf: 'center',
  },
});
