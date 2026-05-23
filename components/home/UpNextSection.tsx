import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from './ColorIconBadge';
import { SectionHeader } from './SectionHeader';
import { homePillCard } from './homeStyles';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

type UpNextIcon = 'pill' | 'content-cut' | 'silverware-fork-knife';

const UP_NEXT = [
  { id: '1', title: 'Medication', time: '05:00 PM', icon: 'pill' as UpNextIcon, color: '#5B9BD5', bg: '#E3F2FD' },
  { id: '2', title: 'Grooming', time: '05:30 PM', icon: 'content-cut' as UpNextIcon, color: '#E91E8C', bg: '#FCE4F0' },
  { id: '3', title: 'Dinner', time: '06:30 PM', icon: 'silverware-fork-knife' as UpNextIcon, color: '#F5A623', bg: '#FFF4E0' },
];

export function UpNextSection() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Up Next" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {UP_NEXT.map((item) => (
          <View key={item.id} style={[homePillCard.card, styles.card]}>
            <ColorIconBadge
              color={item.color}
              backgroundColor={item.bg}
              materialIcon={item.icon}
              size={46}
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
            <TouchableOpacity style={styles.logBtn} activeOpacity={0.85}>
              <AppText variant="caption" weight="800" color={HomeTheme.white}>
                LOG
              </AppText>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingRight: Spacing.sm,
    gap: Spacing.sm,
  },
  card: {
    width: 260,
    marginBottom: 0,
    marginRight: Spacing.sm,
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  logBtn: {
    backgroundColor: HomeTheme.cardGreen,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
});
