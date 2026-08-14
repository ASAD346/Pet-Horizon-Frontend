import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AppText } from '../ui/AppText';
import { EmptyState } from '../ui/EmptyState';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { HomeTheme, Spacing } from '../../constants/theme';
import { useTimezone } from '@/hooks/useTimezone';
import { formatInTimeZone } from '@/lib/timezone';
import { getTaskDisplayName } from '@/src/utils/taskMappings';

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
  duration?: number | null;
  durationLabel?: string;
}

interface RecentActivitySectionProps {
  activities?: RecentActivityItem[];
  isPremium?: boolean;
  onViewAll?: () => void;
  /** When true, only show activities from today (home screen mode) */
  todayOnly?: boolean;
}

function formatRawString(text: string) {
  if (!text) return '';
  // Strip any existing (X min) duration suffixes to avoid duplicate display
  const cleaned = text.replace(/\s*\(\d+\s*min\)/gi, '');
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    const prefix = parts[0].trim();
    const suffix = parts.slice(1).join(':').trim();
    return `${prefix}: ${getTaskDisplayName(suffix)}`;
  }
  return getTaskDisplayName(cleaned);
}

export const RecentActivitySection = React.memo(function RecentActivitySection({
  activities = [],
  isPremium = false,
  onViewAll,
  todayOnly = true,
}: RecentActivitySectionProps) {
  const { timezone } = useTimezone();
  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  const iconColor = isPremium ? '#184F2E' : '#2E7D32';
  const iconBg = isPremium ? 'rgba(212, 160, 23, 0.08)' : 'rgba(46, 125, 50, 0.06)';

  const isActivityToday = (dateStr: string | undefined): boolean => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    const now = new Date();
    const dayD = formatInTimeZone(d, timezone, 'yyyy-MM-dd');
    const dayNow = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
    return dayD === dayNow;
  };

  // Filter to today-only when on the home screen
  const visibleActivities = todayOnly
    ? activities.filter((a) => isActivityToday(a.createdAt))
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
          <View key={item.id} style={[homePillCard.card, { borderWidth: 1, borderColor: cardBorderColor, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <ColorIconBadge
                color={item.color}
                backgroundColor={item.bg}
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
                    {item.icon === 'walk' && item.durationLabel ? ` • ${item.durationLabel}` : ''}
                  </Text>
                </AppText>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <AppText variant="caption" color={HomeTheme.textMuted} style={{ fontSize: 10 }}>
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
