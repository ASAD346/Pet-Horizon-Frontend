import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { DateFilterBar, type DatePreset, type DateRange } from '@/components/ui/DateFilterBar';
import { Spacing, Radius, Palette } from '@/constants/theme';

import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { useActivityHistory, type ActivityHistoryFilters } from '@/hooks/useActivityHistory';
import type { ActivityType, ActivityStatus } from '@/services/journal/activityHistoryApi';
import type { ApiJournalEntry } from '@/types/journal';
import { mapActivityTypeToCategory, categoryToMaterialIcon } from '@/lib/journal/journalMappers';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DateSection {
  title: string;
  data: ApiJournalEntry[];
}

// ─── Color Maps ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  food:        { color: '#D97706', bg: '#FEF3C7' },
  walk:        { color: '#2563EB', bg: '#DBEAFE' },
  medicine:    { color: '#7C3AED', bg: '#EDE9FE' },
  grooming:    { color: '#0D9488', bg: '#CCFBF1' },
  vaccination: { color: '#DB2777', bg: '#FCE7F3' },
  general:     { color: '#4B5563', bg: '#F3F4F6' },
};

// ─── Filter options ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { label: string; value: ActivityType }[] = [
  { label: 'All',          value: 'all'        },
  { label: '🍽 Feeding',   value: 'Feeding'    },
  { label: '🐕 Walks',     value: 'Walk'       },
  { label: '💊 Medicine',  value: 'Medicine'   },
  { label: '✂️ Grooming',  value: 'Grooming'   },
  { label: '💉 Vaccine',   value: 'Vaccination'},
];

const STATUS_OPTIONS: { label: string; value: ActivityStatus; color: string }[] = [
  { label: 'All Status',  value: 'all',       color: '#1A2B4E' },
  { label: '✓ Completed', value: 'completed', color: '#059669' },
  { label: '✗ Skipped',   value: 'skipped',   color: '#DC2626' },
];

const DATE_PRESETS = [
  { label: 'All Time', value: 'all' as DatePreset },
  { label: 'Today',    value: 'today' as DatePreset },
  { label: '7 Days',   value: 'last7' as DatePreset },
  { label: '30 Days',  value: 'last30' as DatePreset },
  { label: 'Custom',   value: 'custom' as DatePreset },
];

// ─── Date grouping helpers ──────────────────────────────────────────────────────

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getSectionTitle(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = today.getTime() - itemDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 6) return d.toLocaleDateString('en-US', { weekday: 'long' });
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupByDate(items: ApiJournalEntry[]): DateSection[] {
  const map = new Map<string, ApiJournalEntry[]>();
  for (const item of items) {
    const key = getDateKey(item.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  const sections: DateSection[] = [];
  for (const [, data] of map) {
    const sorted = [...data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    sections.push({ title: getSectionTitle(sorted[0].createdAt), data: sorted });
  }
  // Sort sections newest-first
  sections.sort((a, b) => {
    const aTs = new Date(a.data[0].createdAt).getTime();
    const bTs = new Date(b.data[0].createdAt).getTime();
    return bTs - aTs;
  });
  return sections;
}

function isEntrySkipped(entry: ApiJournalEntry): boolean {
  return (entry.note || '').toLowerCase().startsWith('skipped');
}

// ─── Activity Card ─────────────────────────────────────────────────────────────

const ActivityCard = React.memo(function ActivityCard({ entry }: { entry: ApiJournalEntry }) {
  const category = mapActivityTypeToCategory(entry.activityType);
  const { color, bg } = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general;
  const icon = categoryToMaterialIcon(category) as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  const skipped = isEntrySkipped(entry);

  const date = new Date(entry.createdAt);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  let noteText = (entry.note || '').trim();
  if (noteText.length > 0) noteText = noteText.charAt(0).toUpperCase() + noteText.slice(1);

  const statusColor = skipped ? '#DC2626' : '#059669';
  const statusBg = skipped ? '#FEE2E2' : '#D1FAE5';
  const statusLabel = skipped ? 'SKIPPED' : 'DONE';

  return (
    <View style={styles.card}>
      {/* Left color stripe */}
      <View style={[styles.cardStripe, { backgroundColor: color }]} />

      <View style={styles.cardBody}>
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>

        {/* Text */}
        <View style={styles.cardText}>
          <View style={styles.cardTitleRow}>
            <AppText variant="body" weight="700" color="#1A1A2E" style={styles.cardTitle} numberOfLines={1}>
              {entry.activityType || 'Activity'}
            </AppText>
            <View style={[styles.badge, { backgroundColor: statusBg }]}>
              <AppText variant="caption" weight="800" color={statusColor} style={styles.badgeText}>
                {statusLabel}
              </AppText>
            </View>
          </View>

          {noteText ? (
            <AppText variant="caption" color="#6B7280" numberOfLines={2} style={styles.noteText}>
              {noteText}
            </AppText>
          ) : null}

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color="#9CA3AF" />
            <AppText variant="caption" color="#9CA3AF" style={styles.timeText}>{timeStr}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
});

// ─── Section Header ────────────────────────────────────────────────────────────

const SectionDateHeader = React.memo(function SectionDateHeader({ title }: { title: string }) {
  const isToday = title === 'Today';
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: isToday ? '#2E7D32' : '#D1D5DB' }]} />
      <AppText
        variant="bodySmall"
        weight="700"
        color={isToday ? '#2E7D32' : '#6B7280'}
        style={styles.sectionTitle}
      >
        {title}
      </AppText>
      <View style={styles.sectionLine} />
    </View>
  );
});

// ─── Filter Chips ──────────────────────────────────────────────────────────────

function FilterRow<T extends string>({
  options,
  selected,
  onChange,
  accentColor = '#2E7D32',
}: {
  options: { label: string; value: T; color?: string }[];
  selected: T;
  onChange: (v: T) => void;
  accentColor?: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((opt) => {
        const active = opt.value === selected;
        const accent = opt.color ?? accentColor;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
            style={[
              styles.filterChip,
              active
                ? { backgroundColor: accent, borderColor: accent }
                : { backgroundColor: '#F5F5F5', borderColor: '#E5E5E5' },
            ]}
          >
            <AppText
              variant="caption"
              weight={active ? '700' : '500'}
              color={active ? '#FFFFFF' : '#616161'}
              style={styles.chipText}
            >
              {opt.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function ActivityEmptyState({ onReset, hasFilters }: { onReset: () => void; hasFilters: boolean }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="clipboard-text-clock-outline" size={40} color="#2E7D32" />
      </View>
      <AppText variant="h3" weight="700" color="#1A1A2E" style={styles.emptyTitle}>
        No Activities Found
      </AppText>
      <AppText variant="bodySmall" color="#6B7280" align="center" style={styles.emptyDesc}>
        {hasFilters
          ? 'No activities match the selected filters.'
          : 'Completed pet care activities will appear here once logged.'}
      </AppText>
      {hasFilters ? (
        <TouchableOpacity onPress={onReset} style={styles.resetBtn} activeOpacity={0.8}>
          <AppText variant="bodySmall" weight="700" color="#FFFFFF">Reset Filters</AppText>
        </TouchableOpacity>
      ) : null}
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
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const filters: ActivityHistoryFilters = { type, status, datePreset, customRange };

  const { items, total, hasMore, isLoading, loadMore } = useActivityHistory(
    token, pet?._id, filters,
  );

  const hasFilters = type !== 'all' || status !== 'all' || datePreset !== 'all';

  const resetFilters = useCallback(() => {
    setType('all');
    setStatus('all');
    setDatePreset('all');
    setCustomRange(undefined);
  }, []);

  const handleDateChange = useCallback((preset: DatePreset, range: DateRange) => {
    setDatePreset(preset);
    setCustomRange(preset === 'custom' ? range : undefined);
  }, []);

  // Group items into date sections
  const sections = useMemo(() => groupByDate(items), [items]);

  const renderItem = useCallback(({ item }: { item: ApiJournalEntry }) => (
    <ActivityCard entry={item} />
  ), []);

  const renderSectionHeader = useCallback(({ section }: { section: DateSection }) => (
    <SectionDateHeader title={section.title} />
  ), []);

  const keyExtractor = useCallback((item: ApiJournalEntry) => item._id, []);

  const FilterHeader = useMemo(() => (
    <View style={styles.filterSection}>
      <View style={styles.filterBlock}>
        <AppText variant="caption" weight="700" color="#9CA3AF" style={styles.filterSectionLabel}>
          ACTIVITY TYPE
        </AppText>
        <FilterRow options={TYPE_OPTIONS} selected={type} onChange={setType} />
      </View>

      <View style={styles.filterBlock}>
        <AppText variant="caption" weight="700" color="#9CA3AF" style={styles.filterSectionLabel}>
          STATUS
        </AppText>
        <FilterRow
          options={STATUS_OPTIONS}
          selected={status}
          onChange={setStatus}
          accentColor="#1A2B4E"
        />
      </View>

      <View style={styles.filterBlock}>
        <AppText variant="caption" weight="700" color="#9CA3AF" style={styles.filterSectionLabel}>
          DATE RANGE
        </AppText>
        <DateFilterBar
          selected={datePreset}
          customRange={customRange}
          onChange={handleDateChange}
          presets={DATE_PRESETS}
        />
      </View>
    </View>
  ), [type, status, datePreset, customRange, handleDateChange]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Activity History"
        variant="white"
        onBack={() => router.back()}
      />

      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            {FilterHeader}
            {/* Summary row */}
            {!isLoading && items.length > 0 ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryBadge}>
                  <MaterialCommunityIcons name="history" size={13} color="#2E7D32" />
                  <AppText variant="caption" weight="700" color="#2E7D32" style={styles.summaryText}>
                    {items.length} {items.length === 1 ? 'activity' : 'activities'}
                    {hasFilters ? ' (filtered)' : ''}
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(tabBarClearance, insets.bottom) + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoading && items.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Palette.success} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={Palette.success} />
              <AppText variant="bodySmall" color="#9CA3AF" style={{ marginTop: Spacing.sm }}>
                Loading activities…
              </AppText>
            </View>
          ) : (
            <ActivityEmptyState onReset={resetFilters} hasFilters={hasFilters} />
          )
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#1A2B4E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6F8' },

  // ── Filter section ────────────────────────────────────────────
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    paddingBottom: Spacing.xs,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  filterBlock: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  filterSectionLabel: { letterSpacing: 0.7, marginBottom: 5, fontSize: 10 },
  chipRow: { flexDirection: 'row', gap: 6, paddingBottom: 4, paddingHorizontal: 2 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  chipText: { fontSize: 12 },

  // ── Summary row ──────────────────────────────────────────────
  summaryRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  summaryText: { fontSize: 12 },

  // ── Section header ───────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // ── List & cards ─────────────────────────────────────────────
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  cardStripe: { width: 4 },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 3 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 14, lineHeight: 18 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 9, letterSpacing: 0.5 },
  noteText: { lineHeight: 17 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11 },

  // ── Empty / loader ───────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { marginBottom: Spacing.xs, textAlign: 'center' },
  emptyDesc: { lineHeight: 20, marginBottom: Spacing.lg, maxWidth: 260, textAlign: 'center' },
  resetBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderRadius: Radius.full, backgroundColor: '#2E7D32',
  },
  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },
  centerLoader: { paddingVertical: Spacing.xxl, alignItems: 'center' },
});
