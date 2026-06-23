import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AppText } from '../ui/AppText';
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
}

interface RecentActivitySectionProps {
  activities?: RecentActivityItem[];
}

export function RecentActivitySection({ activities = [] }: RecentActivitySectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Recent Activity" actionLabel="SEE ALL" onActionPress={() => {}} />
      {activities.length === 0 ? (
        <View style={[homePillCard.card, styles.emptyCard]}>
          <AppText variant="bodySmall" color={HomeTheme.textMuted} align="center">
            No activity yet. Use Quick Actions to log something.
          </AppText>
        </View>
      ) : (
        activities.map((item) => (
          <View key={item.id} style={homePillCard.card}>
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
                  {' '}{item.actionText}
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
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
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
  iconBadge: {
    alignSelf: 'center',
  },
});
