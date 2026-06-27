import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing, Palette } from '../../constants/theme';
import type { JournalCategory, TimelineEvent } from './journalData';

interface ActivityTimelineSectionProps {
  events: TimelineEvent[];
  categoryFilter: JournalCategory;
  onEventPress?: (eventId: string) => void;
}

function filterEvents(events: TimelineEvent[], filter: JournalCategory) {
  if (filter === 'all') return events;
  return events.filter((e) => e.category === filter);
}

function TimelineRow({
  event,
  isLast,
  onPress,
}: {
  event: TimelineEvent;
  isLast: boolean;
  onPress?: (eventId: string) => void;
}) {
  const completed = event.status === 'completed';

  return (
    <View style={styles.row}>
      {/* Time column */}
      <AppText variant="caption" weight="700" color="#9CA3AF" style={styles.time}>
        {event.time}
      </AppText>

      {/* Timeline line and outer ring */}
      <View style={styles.timelineCol}>
        <View style={[styles.dotOuter, { borderColor: completed ? '#16A34A' : '#9CA3AF' }]}>
          <View style={[styles.dotInner, { backgroundColor: completed ? '#16A34A' : '#9CA3AF' }]} />
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      {/* Modern, minimalist border-only card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={onPress ? 0.85 : 1}
        disabled={!onPress}
        onPress={() => onPress?.(event.id)}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={event.materialIcon} size={18} color="#4B5563" />
        </View>
        <View style={styles.cardText}>
          <AppText variant="bodySmall" weight="700" color="#111827">
            {event.title}
          </AppText>
          <AppText variant="caption" color="#9CA3AF" style={{ marginTop: 2, textTransform: 'uppercase', fontSize: 9, letterSpacing: 0.3 }}>
            {event.category}
          </AppText>
        </View>
        
        {/* Right side status indicator */}
        <View style={styles.statusCol}>
          <View style={[styles.statusDot, { backgroundColor: completed ? '#16A34A' : '#2563EB' }]} />
          <AppText variant="caption" weight="800" color={completed ? '#16A34A' : '#2563EB'} style={styles.statusText}>
            {completed ? 'COMPLETED' : 'SCHEDULED'}
          </AppText>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function ActivityTimelineSection({
  events,
  categoryFilter,
  onEventPress,
}: ActivityTimelineSectionProps) {
  const filtered = useMemo(
    () => filterEvents(events, categoryFilter),
    [events, categoryFilter]
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="body" weight="800" color="#111827" style={styles.headerTitle}>
          Activity Timeline
        </AppText>
        <AppText variant="caption" weight="700" color="#9CA3AF">
          {filtered.length} Events
        </AppText>
      </View>

      <View style={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="bodySmall" color="#9CA3AF" style={{ textAlign: 'center', lineHeight: 18 }}>
              No activities logged for this day. Completed items will automatically sync in this feed.
            </AppText>
          </View>
        ) : (
          filtered.map((event, index) => (
            <TimelineRow
              key={event.id}
              event={event}
              isLast={index === filtered.length - 1}
              onPress={onEventPress}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 16,
  },
  list: {
    gap: Spacing.sm,
  },
  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  time: {
    width: 60,
    paddingTop: 15,
    fontSize: 11,
    textAlign: 'right',
    paddingRight: 10,
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  dotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  line: {
    position: 'absolute',
    top: 28,
    bottom: -12,
    width: 1,
    backgroundColor: '#E5E7EB',
    left: 11,
    zIndex: 1,
  },
  
  // Clean Revolut style card
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: Spacing.sm + 1,
    marginBottom: Spacing.xs,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 1,
  },
  statusCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: Spacing.xs,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 8,
    letterSpacing: 0.4,
  },
});
