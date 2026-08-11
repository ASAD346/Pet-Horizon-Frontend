import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';
import type { JournalCategory, TimelineEvent } from './journalData';
import { getCategoryStyle } from './journalData';
import { useAuth } from '@/hooks/useAuth';

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
  const skipped = event.status === 'skipped';
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';
  
  const brandColor = isPremium ? '#184F2E' : '#2E7D32';
  const brandBg = isPremium ? 'rgba(212, 160, 23, 0.08)' : 'rgba(46, 125, 50, 0.06)';

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold border for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border for free

  const catStyle = getCategoryStyle(event.category);
  let dotColor = catStyle.color;

  if (skipped) {
    dotColor = '#EF4444';
  } else if (event.status === 'missed') {
    dotColor = '#9CA3AF';
  }

  let badgeBg = '#FEF3C7';
  let badgeText = '#D97706';
  let badgeLabel = 'SCHEDULED';

  if (completed) {
    badgeBg = '#DCFCE7';
    badgeText = '#16A34A';
    badgeLabel = 'COMPLETED';
  } else if (skipped) {
    badgeBg = '#FEE2E2';
    badgeText = '#EF4444';
    badgeLabel = 'SKIPPED';
  } else if (event.status === 'missed') {
    badgeBg = '#F3F4F6';
    badgeText = '#4B5563';
    badgeLabel = 'MISSED';
  }

  return (
    <View style={styles.row}>
      {/* Time column */}
      <AppText variant="caption" weight="700" color="#9CA3AF" style={styles.time}>
        {event.time}
      </AppText>

      {/* Timeline line and outer ring */}
      <View style={styles.timelineCol}>
        <View style={[styles.timelineNode, { backgroundColor: catStyle.bg, borderColor: dotColor }]}>
          <MaterialCommunityIcons name={event.materialIcon} size={15} color={dotColor} />
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      {/* Modern, minimalist border-only card */}
      <TouchableOpacity
        style={[styles.card, { borderColor: cardBorderColor }]}
        activeOpacity={onPress ? 0.85 : 1}
        disabled={!onPress}
        onPress={() => onPress?.(event.id)}
      >
        <View style={styles.cardText}>
          <AppText variant="bodySmall" weight="700" color="#1F2937">
            {event.title.replace(/\s*\(\d+\s*min\)/gi, '')}
          </AppText>
          {event.category === 'walk' && event.durationLabel ? (
            <AppText variant="caption" weight="600" color="#2E7D32" style={{ marginTop: 2 }}>
              Walk Duration: {event.durationLabel}
            </AppText>
          ) : null}
          {event.notes && event.notes.trim() !== '' && event.notes.toLowerCase() !== event.title.toLowerCase() ? (
            <AppText variant="caption" color="#4B5563" style={{ marginTop: 2 }}>
              {event.notes.replace(/\s*\(\d+\s*min\)/gi, '')}
            </AppText>
          ) : null}
          <AppText variant="caption" color={dotColor} style={{ marginTop: 4, textTransform: 'uppercase', fontSize: 9, letterSpacing: 0.3, fontWeight: '800' }}>
            {event.category}
          </AppText>
        </View>
        
        {/* Right side status indicator */}
        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <AppText variant="caption" weight="800" color={badgeText} style={styles.statusText}>
            {badgeLabel}
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
  const filtered = useMemo(() => {
    const rawFiltered = filterEvents(events, categoryFilter);
    const seen = new Set<string>();
    return rawFiltered.filter((event) => {
      const key = `${event.time || ''}-${event.title || ''}-${event.status || ''}-${event.category || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [events, categoryFilter]);

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
    paddingTop: 11,
    fontSize: 11,
    textAlign: 'right',
    paddingRight: 10,
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
    marginRight: Spacing.xs,
    alignSelf: 'stretch',
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    zIndex: 2,
  },
  line: {
    position: 'absolute',
    top: 20,
    bottom: -30,
    width: 2,
    backgroundColor: '#E2E8F0',
    left: 15,
    zIndex: 1,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardText: {
    flex: 1,
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
