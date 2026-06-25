import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Keyboard,
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
  useScheduleHistory,
  type ScheduleHistoryFilters,
} from '@/hooks/useScheduleHistory';
import type {
  ScheduleHistoryStatus,
  ScheduleHistoryType,
  ScheduleHistoryItem,
} from '@/services/schedules/scheduleHistoryApi';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

// ─── Filter chip configs ───────────────────────────────────────────────────────

const STATUS_CHIPS: { label: string; value: ScheduleHistoryStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'done' },
  { label: 'Skipped', value: 'skipped' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Disabled', value: 'disabled' },
];

const TYPE_CHIPS: { label: string; value: ScheduleHistoryType }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Feeding', value: 'feeding' },
  { label: 'Walk', value: 'walk' },
  { label: 'Medicine', value: 'medicine' },
  { label: 'Grooming', value: 'grooming' },
  { label: 'Vaccination', value: 'vaccination' },
];

// ─── Icon helpers ──────────────────────────────────────────────────────────────

const KIND_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  feeding: 'silverware-fork-knife',
  walk: 'walk',
  medicine: 'pill',
  grooming: 'content-cut',
  vaccination: 'needle',
};

const KIND_COLORS: Record<string, { color: string; bg: string }> = {
  feeding: { color: '#D97706', bg: '#FEF3C7' },
  walk: { color: '#2563EB', bg: '#DBEAFE' },
  medicine: { color: '#9333EA', bg: '#F3E8FF' },
  grooming: { color: '#0D9488', bg: '#CCFBF1' },
  vaccination: { color: '#DB2777', bg: '#FCE7F3' },
};

function kindLabel(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function statusToBadge(status: ScheduleHistoryItem['status']): 'done' | 'skipped' | 'pending' {
  if (status === 'done') return 'done';
  if (status === 'skipped') return 'skipped';
  return 'pending';
}

// ─── Schedule Item Card ────────────────────────────────────────────────────────

const ScheduleHistoryCard = React.memo(function ScheduleHistoryCard({
  item,
}: {
  item: ScheduleHistoryItem;
}) {
  const { color, bg } = KIND_COLORS[item.kind] ?? { color: '#616161', bg: '#F3F4F6' };
  const icon = KIND_ICONS[item.kind] ?? 'calendar-check';

  const dateLabel = item.date
    ? new Date(item.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const timeLabel = item.timeOfDay
    ? (() => {
        const [h, m] = item.timeOfDay.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      })()
    : null;

  return (
    <View style={styles.card}>
      {/* Icon Badge */}
      <View style={[styles.iconBadge, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>

      {/* Text */}
      <View style={styles.cardText}>
        <View style={styles.cardTitleRow}>
          <AppText variant="bodySmall" weight="700" color="#212121" style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="caption" color="#9E9E9E" style={styles.kindTag}>
            {kindLabel(item.kind)}
          </AppText>
        </View>
        {item.subtitle ? (
          <AppText variant="caption" color="#616161" numberOfLines={1}>
            {item.subtitle}
          </AppText>
        ) : null}
        {dateLabel || timeLabel ? (
          <View style={styles.metaRow}>
            {dateLabel ? (
              <View style={styles.metaChip}>
                <Ionicons name="calendar-outline" size={10} color="#9E9E9E" />
                <AppText variant="caption" color="#9E9E9E" style={styles.metaText}>{dateLabel}</AppText>
              </View>
            ) : null}
            {timeLabel ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={10} color="#9E9E9E" />
                <AppText variant="caption" color="#9E9E9E" style={styles.metaText}>{timeLabel}</AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Status Badge */}
      <StatusBadge status={statusToBadge(item.status)} />
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

export default function ScheduleHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token } = useAuth();
  const { pet } = useActivePet(token);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ScheduleHistoryStatus>('all');
  const [type, setType] = useState<ScheduleHistoryType>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filters: ScheduleHistoryFilters = {
    status,
    type,
    datePreset,
    customRange,
    search: debouncedSearch,
  };

  const { items, total, hasMore, isLoading, loadMore, refetch } = useScheduleHistory(
    token,
    pet?._id,
    filters,
  );

  const handleDateChange = useCallback((preset: DatePreset, range: DateRange) => {
    setDatePreset(preset);
    setCustomRange(preset === 'custom' ? range : undefined);
  }, []);

  const handleStatusChange = useCallback((v: ScheduleHistoryStatus) => {
    setStatus(v);
  }, []);

  const handleTypeChange = useCallback((v: ScheduleHistoryType) => {
    setType(v);
  }, []);

  const renderItem = useCallback(({ item }: { item: ScheduleHistoryItem }) => (
    <ScheduleHistoryCard item={item} />
  ), []);

  const keyExtractor = useCallback((item: ScheduleHistoryItem) => item._id, []);

  const emptyTitle = isLoading
    ? ''
    : status !== 'all' || type !== 'all'
    ? `No ${status !== 'all' ? status : ''} ${type !== 'all' ? type : 'schedule'} entries found`
    : 'No schedules found';

  const emptyDesc = isLoading
    ? ''
    : debouncedSearch
    ? `No schedules matching "${debouncedSearch}" for this date range.`
    : 'No schedule records found for the selected filters.';

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Schedule History"
        variant="white"
        onBack={() => router.back()}
      />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#9E9E9E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by pet, type, or notes…"
          placeholderTextColor="#BDBDBD"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && Platform.OS !== 'ios' ? (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color="#9E9E9E" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <AppText variant="caption" weight="700" color="#9E9E9E" style={styles.filterLabel}>
          STATUS
        </AppText>
        <FilterChips
          chips={STATUS_CHIPS}
          selected={status}
          onChange={handleStatusChange}
        />

        <AppText variant="caption" weight="700" color="#9E9E9E" style={[styles.filterLabel, styles.filterLabelGap]}>
          TYPE
        </AppText>
        <FilterChips
          chips={TYPE_CHIPS}
          selected={type}
          onChange={handleTypeChange}
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
            {total > 0 ? `${total} record${total !== 1 ? 's' : ''}` : `${items.length} result${items.length !== 1 ? 's' : ''}`}
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
              icon="calendar-search"
              title={emptyTitle}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    padding: 0,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
  },
  kindTag: {
    fontSize: 10,
    color: '#BDBDBD',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
