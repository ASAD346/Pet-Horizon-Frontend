import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from '../home/ColorIconBadge';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';
import type { JournalCategory, TimelineEvent } from './journalData';
import { getCategoryStyle } from './journalData';

interface ActivityTimelineSectionProps {
  events: TimelineEvent[];
  categoryFilter: JournalCategory;
}

function filterEvents(events: TimelineEvent[], filter: JournalCategory) {
  if (filter === 'all') return events;
  return events.filter((e) => e.category === filter);
}

function TimelineRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const { color, bg } = getCategoryStyle(event.category);
  const completed = event.status === 'completed';

  return (
    <View style={styles.row}>
      <AppText variant="caption" weight="600" color={JournalTheme.textMuted} style={styles.time}>
        {event.time}
      </AppText>

      <View style={styles.timelineCol}>
        <View style={[styles.dot, { backgroundColor: completed ? JournalTheme.completed : color }]} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      <View style={styles.card}>
        <ColorIconBadge
          color={color}
          backgroundColor={bg}
          materialIcon={event.materialIcon}
          size={44}
          iconSize={22}
          shape="rounded"
        />
        <View style={styles.cardText}>
          <AppText variant="bodySmall" weight="800" color={JournalTheme.text}>
            {event.title}
          </AppText>
          <AppText
            variant="caption"
            weight="600"
            color={completed ? JournalTheme.completed : JournalTheme.textMuted}
          >
            {completed ? 'Completed' : 'Scheduled'}
          </AppText>
        </View>
        {completed ? (
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={18} color={JournalTheme.surface} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ActivityTimelineSection({ events, categoryFilter }: ActivityTimelineSectionProps) {
  const filtered = useMemo(
    () => filterEvents(events, categoryFilter),
    [events, categoryFilter]
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="body" weight="800" color={JournalTheme.text} style={styles.headerTitle}>
          Activity Timeline
        </AppText>
        <AppText variant="bodySmall" color={JournalTheme.textMuted}>
          {filtered.length} Events
        </AppText>
      </View>

      <View style={styles.list}>
        {filtered.map((event, index) => (
          <TimelineRow
            key={event.id}
            event={event}
            isLast={index === filtered.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 17,
  },
  list: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  time: {
    width: 68,
    paddingTop: 14,
    fontSize: 11,
  },
  timelineCol: {
    width: 20,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 18,
    zIndex: 1,
  },
  line: {
    position: 'absolute',
    top: 28,
    bottom: -Spacing.sm,
    width: 2,
    backgroundColor: JournalTheme.timelineLine,
    left: 9,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JournalTheme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.xs,
    ...cardShadow,
  },
  cardText: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: JournalTheme.completed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
