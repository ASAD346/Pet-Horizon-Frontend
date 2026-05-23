import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { HomeTheme, Spacing } from '../../constants/theme';

type ScheduleItem = {
  id: string;
  title: string;
  subtitle: string;
  status: 'completed-checks' | 'done-label';
  iconType: 'completed' | 'icon';
  color: string;
  bg?: string;
  materialIcon?: 'walk' | 'silverware-fork-knife';
};

const SCHEDULE: ScheduleItem[] = [
  {
    id: '1',
    title: 'Breakfast',
    subtitle: 'Done by Sarah at 08:05 AM',
    status: 'completed-checks',
    iconType: 'completed',
    color: '#5CB35D',
  },
  {
    id: '2',
    title: 'Heartgard Medicine',
    subtitle: 'Done by Ali at 4:39 PM',
    status: 'completed-checks',
    iconType: 'completed',
    color: '#5B9BD5',
  },
  {
    id: '3',
    title: 'Afternoon Walk',
    subtitle: 'Scheduled for 02:00 PM',
    status: 'done-label',
    iconType: 'icon',
    color: '#F5A623',
    bg: '#FFF8E1',
    materialIcon: 'walk',
  },
  {
    id: '4',
    title: 'Evening Dinner',
    subtitle: 'Scheduled for 06:30 PM',
    status: 'done-label',
    iconType: 'icon',
    color: '#E57373',
    bg: '#FFEBEE',
    materialIcon: 'silverware-fork-knife',
  },
];

export function TodaysScheduleSection() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Today's Schedule" actionLabel="SEE ALL" onActionPress={() => {}} />
      {SCHEDULE.map((item) => (
        <View key={item.id} style={homePillCard.card}>
          {item.iconType === 'completed' ? (
            <ColorIconBadge color={item.color} completed size={44} iconSize={24} shape="circle" />
          ) : (
            <ColorIconBadge
              color={item.color}
              backgroundColor={item.bg}
              materialIcon={item.materialIcon}
              size={44}
              iconSize={22}
            />
          )}
          <View style={styles.textBlock}>
            <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
              {item.title}
            </AppText>
            <AppText variant="caption" color={HomeTheme.textMuted}>
              {item.subtitle}
            </AppText>
          </View>
          {item.status === 'completed-checks' ? (
            <View style={styles.checks}>
              <Ionicons name="checkmark" size={16} color={HomeTheme.cardGreen} />
              <Ionicons name="checkmark" size={16} color={HomeTheme.cardGreen} style={styles.checkOverlap} />
            </View>
          ) : (
            <AppText variant="caption" weight="600" color="#8FAF8F">
              Done
            </AppText>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  checks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkOverlap: {
    marginLeft: -8,
  },
});
