import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { HomeTheme, Spacing } from '../../constants/theme';

const ACTIVITIES = [
  {
    id: '1',
    title: 'Morning Walk Completed',
    time: 'Today, 08:00 AM',
    icon: 'walk' as const,
    color: '#5CB35D',
    bg: '#E8F5E9',
  },
  {
    id: '2',
    title: 'Breakfast Served',
    time: 'Today, 07:35 AM',
    icon: 'silverware-fork-knife' as const,
    color: '#F5A623',
    bg: '#FFF4E0',
  },
  {
    id: '3',
    title: 'Gave vitamins',
    time: 'Yesterday',
    icon: 'pill' as const,
    color: '#5B9BD5',
    bg: '#E3F2FD',
  },
];

export function RecentActivitySection() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Recent Activity" actionLabel="SEE ALL" onActionPress={() => {}} />
      {ACTIVITIES.map((item) => (
        <View key={item.id} style={homePillCard.card}>
          <ColorIconBadge
            color={item.color}
            backgroundColor={item.bg}
            materialIcon={item.icon}
            size={44}
            iconSize={22}
          />
          <View style={styles.textBlock}>
            <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
              {item.title}
            </AppText>
            <AppText variant="caption" color={HomeTheme.textMuted}>
              {item.time}
            </AppText>
          </View>
        </View>
      ))}
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
});
