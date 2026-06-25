import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterChips } from '@/components/ui/FilterChips';
import { DateFilterBar, type DatePreset, type DateRange } from '@/components/ui/DateFilterBar';
import { Spacing, Radius, Palette } from '@/constants/theme';
import { Colors } from '@/constants/colors';

import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import {
  useActivityHistory,
  type ActivityHistoryFilters,
} from '@/hooks/useActivityHistory';
import type { ActivityType, ActivityStatus } from '@/services/journal/activityHistoryApi';
import type { ApiJournalEntry } from '@/types/journal';
import {
  mapActivityTypeToCategory,
  categoryToMaterialIcon,
} from '@/lib/journal/journalMappers';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

// ─── Filter chip configs ───────────────────────────────────────────────────────

const TYPE_CHIPS: { label: string; value: ActivityType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Feeding', value: 'Feeding' },
  { label: 'Walks', value: 'Walk' },
  { label: 'Medicine', value: 'Medicine' },
  { label: 'Grooming', value: 'Grooming' },
  { label: 'Vaccinations', value: 'Vaccination' },
];

const STATUS_CHIPS: { label: string; value: ActivityStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Skipped', value: 'skipped' },
];

// ─── Color map ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  food: { color: '#D97706', bg: '#FEF3C7' },
  walk: { color: '#2563EB', bg: '#DBEAFE' },
  medicine: { color: '#9333EA', bg: '#F3E8FF' },
  grooming: { color: '#0D9488', bg: '#CCFBF1' },
  vaccination: { color: '#DB2777', bg: '#FCE7F3' },
  general: { color: '#4B5563', bg: '#F3F4F6' },
};

function isEntrySkipped(entry: ApiJournalEntry): boolean {
  return (entry.note || '').toLowerCase().startsWith('skipped');
}

// ─── Activity Item Card ────────────────────────────────────────────────────────

const ActivityHistoryCard = React.memo(function ActivityHistoryCard({
  entry,
}: {
  entry: ApiJournalEntry;
}) {
  const category = mapActivityTypeToCategory(entry.activityType);
  const { color, bg } = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general;
  const icon = categoryToMaterialIcon(category) as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  const skipped = isEntrySkipped(entry);

  const date = new Date(entry.createdAt);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timeLabel = isToday
    ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });

  let noteText = (entry.note || '').trim();
  // Capitalise first char for display
  if (noteText.length > 0) noteText = noteText.charAt(0).toUpperCase() + noteText.slice(1);

  return (
    <View style={styles.card}>
      {/* Icon */}
      <View style={[styles.iconBadge, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>

      {/* Text */}
      <View style={styles.cardText}>
        <AppText variant="bodySmall" weight="700" color="#212121" numberOfLines={1}>
          {entry.activityType || 'Activity'}
        </AppText>
        {noteText ? (
          <AppText variant="caption" color="#616161" numberOfLines={2}>
            {noteText}
          </AppText>
        ) : null}
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={10} color="#9E9E9E" />
          <AppText variant="caption" color="#9E9E9E" style={styles.metaText}>
            {timeLabel}
          </AppText>
        </View>
      </View>

      {/* Status */}
      <StatusBadge status={skipped ? 'skipped' : 'done'} />
    </View>
  );
});

// ─── List Footer ──────────────────────────────────────────────────────────────

function ListFooter({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={Palette.success} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token } = useAuth();
  const { pet } = useActivePet(token);

  const [type, setType] = useState<ActivityType>('all');
  const [status, setStatus] = useState<ActivityStatus>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('last7');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const filters: ActivityHistoryFilters = {
    type,
    status,
    datePreset,
    customRange,
  };

  const { items, total, hasMore, isLoading, loadMore } = useActivityHistory(
    token,
    pet?._id,
    filters,
  );

  const handleDateChange = useCallback((preset: DatePreset, range: DateRange) => {
    setDatePreset(preset);
    setCustomRange(preset === 'custom' ? range : undefined);
  }, []);

  const handleTypeChange = useCallback((v: ActivityType) => setType(v), []);
  const handleStatusChange = useCallback((v: ActivityStatus) => setStatus(v), []);

  const renderItem = useCallback(
    ({ item }: { item: ApiJournalEntry }) => <ActivityHistoryCard entry={item} />,
    [],
  );
  const keyExtractor = useCallback((item: ApiJournalEntry) => item._id, []);

  const emptyDesc =
    type !== 'all' || status !== 'all'
      ? `No ${status !== 'all' ? status : ''} ${type !== 'all' ? type.toLowerCase() : 'activity'} records found for this date range.`
      : 'No activity records found for the selected date range.';

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Activity History"
        variant="white"
        onBack={() => router.back()}
      />

      {/* Filters */}
      <View style={styles.filters}>
        <AppText variant="caption" weight="700" color="#9E9E9E" style={styles.filterLabel}>
          ACTIVITY TYPE
        </AppText>
        <FilterChips
          chips={TYPE_CHIPS}
          selected={type}
          onChange={handleTypeChange}
        />

        <AppText variant="caption" weight="700" color="#9E9E9E" style={[styles.filterLabel, styles.filterLabelGap]}>
          STATUS
        </AppText>
        <FilterChips
          chips={STATUS_CHIPS}
          selected={status}
          onChange={handleStatusChange}
          accentColor="#2563EB"
          accentBg="#DBEAFE"
        />

        <AppText variant="caption" weight="700" color="#9E9E9E" style={[styles.filterLabel, styles.filterLabelGap]}>
          DATE RANGE
        </AppText>
        <DateFilterBar
          selected={datePreset}
          customRange={customRange}
          onChange={handleDateChange}
        />
      </View>

      {/* Results count */}
      {!isLoading && items.length > 0 ? (
        <View style={styles.countRow}>
          <AppText variant="caption" color="#9E9E9E">
            {items.length} activit{items.length !== 1 ? 'ies' : 'y'}
            {total > items.length ? ` of ${total}` : ''}
          </AppText>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(tabBarClearance, insets.bottom) + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={<ListFooter loading={isLoading && items.length > 0} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={Palette.success} />
            </View>
          ) : (
            <EmptyState
              icon="history"
              title="No activity found"
              description={emptyDesc}
            />
          )
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filters: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  filterLabel: {
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  filterLabelGap: {
    marginTop: Spacing.sm,
  },
  countRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#1A2B4E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  metaText: {
    fontSize: 10,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  centerLoader: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
});
