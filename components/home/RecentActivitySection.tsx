import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { activityCategoryStyle, formatActivityTime } from '@/lib/activity/activityDisplay';
import { HomeTheme, Spacing } from '../../constants/theme';
import type { ActivityEntry } from '@/types/activity';

interface RecentActivitySectionProps {
  entries?: ActivityEntry[];
  loading?: boolean;
  onSeeAllPress?: () => void;
}

export function RecentActivitySection({
  entries = [],
  loading = false,
  onSeeAllPress,
}: RecentActivitySectionProps) {
  const preview = entries.slice(0, 3);

  return (
    <View style={styles.section}>
      <SectionHeader title="Recent Activity" actionLabel="SEE ALL" onActionPress={onSeeAllPress} />
      {loading && preview.length === 0 ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
      ) : preview.length === 0 ? (
        <AppText variant="caption" color={HomeTheme.textMuted} style={styles.empty}>
          No activities logged today.
        </AppText>
      ) : (
        preview.map((item) => {
          const style = activityCategoryStyle(item.category);
          return (
            <View key={item._id} style={homePillCard.card}>
              <ColorIconBadge
                color={style.color}
                backgroundColor={style.bg}
                materialIcon={style.icon}
                size={44}
                iconSize={22}
              />
              <View style={styles.textBlock}>
                <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                  {item.title}
                  {item.isCompleted ? ' ✓' : ''}
                </AppText>
                <AppText variant="caption" color={HomeTheme.textMuted}>
                  {formatActivityTime(item.date)}
                </AppText>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  loader: {
    marginVertical: Spacing.md,
  },
  empty: {
    marginBottom: Spacing.sm,
  },
});
