import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { AppText } from '../ui/AppText';
import { EmptyState } from '../ui/EmptyState';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homeCardShadow } from './homeStyles';
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
  exactTime?: string;
  actorImage?: string;
  actorInitial?: string;
  actorColor?: string;
  category?: string;
  isSkipped?: boolean;
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
  const cleaned = text.replace(/\s*\(\d+\s*min\)/gi, '').trim();
  
  if (cleaned.startsWith('added journal:')) {
    const detail = cleaned.replace(/^added journal:\s*/i, '');
    return `added journal: ${getTaskDisplayName(detail)}`;
  }
  
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
          <View
            key={item.id}
            style={[
              styles.activityCard,
              {
                borderWidth: 1,
                borderColor: cardBorderColor,
                borderLeftWidth: 4,
                borderLeftColor: item.color,
              }
            ]}
          >
            <View style={styles.cardContent}>
              <ColorIconBadge
                color={item.color}
                backgroundColor={item.bg}
                materialIcon={item.icon}
                size={36}
                iconSize={18}
                style={styles.iconBadge}
              />
              
              <View style={styles.textBlock}>
                {/* Action Title */}
                <AppText variant="bodySmall" weight="600" style={{ color: HomeTheme.text }}>
                  {formatRawString(item.actionText)}
                  {item.icon === 'walk' && item.durationLabel ? ` • ${item.durationLabel}` : ''}
                </AppText>

                {/* Actor & Time Info Row */}
                <View style={styles.metaRow}>
                  {/* Actor Avatar or Badge */}
                  <View style={[styles.miniAvatar, { backgroundColor: item.actorColor || '#5B9BD5' }]}>
                    {item.actorImage ? (
                      <Image source={{ uri: item.actorImage }} style={styles.miniAvatarImage} />
                    ) : (
                      <Text style={styles.miniAvatarText}>{item.actorInitial || 'U'}</Text>
                    )}
                  </View>
                  
                  {/* Actor Name */}
                  <AppText variant="caption" color={HomeTheme.textMuted} weight="600" style={styles.actorNameText}>
                    {item.actorName}
                  </AppText>

                  <Text style={styles.separator}>•</Text>

                  {/* Exact & Relative Time */}
                  <AppText variant="caption" color={HomeTheme.textMuted} style={{ fontSize: 10 }}>
                    {item.exactTime} {item.time ? `(${item.time})` : ''}
                  </AppText>
                </View>
              </View>
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 8,
    marginBottom: 8,
    marginHorizontal: 2,
    minHeight: 52,
    ...homeCardShadow,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  miniAvatarImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  miniAvatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  actorNameText: {
    fontSize: 10,
  },
  separator: {
    color: HomeTheme.textMuted,
    marginHorizontal: 6,
    fontSize: 9,
  },
  iconBadge: {
    alignSelf: 'center',
  },
});
