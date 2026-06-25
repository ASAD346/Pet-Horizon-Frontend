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
  isPremium?: boolean;
}

export const RecentActivitySection = React.memo(function RecentActivitySection({ activities = [], isPremium = false }: RecentActivitySectionProps) {
  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  const iconColor = isPremium ? '#184F2E' : '#2E7D32';
  const iconBg = isPremium ? 'rgba(212, 160, 23, 0.08)' : 'rgba(46, 125, 50, 0.06)';

  return (
    <View style={styles.section}>
      <SectionHeader title="Recent Activity" actionLabel="SEE ALL" onActionPress={() => {}} />
      {activities.length === 0 ? (
        <View style={[homePillCard.card, styles.emptyCard, { borderWidth: 1, borderColor: cardBorderColor }]}>
          <AppText variant="bodySmall" color={HomeTheme.textMuted} align="center">
            No activity yet. Use Quick Actions to log something.
          </AppText>
        </View>
      ) : (
        activities.map((item) => (
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
