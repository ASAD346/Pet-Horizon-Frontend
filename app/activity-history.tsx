import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { getPresetRange, type DatePreset, type DateRange } from '@/components/ui/DateFilterBar';
import { Spacing, Radius, Palette, HomeTheme } from '@/constants/theme';

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

// ─── Unified Theme-based Category Colors & Icons ────────────────────────────────

const AMBER  = Palette.warning;         // '#F57C00'
const RED    = Palette.error;           // '#D32F2F'
const RED_L  = Palette.errorLight;      // '#FFEBEE'
const PURPLE = '#7C3AED';
const TEAL   = HomeTheme.teal;          // '#00695C'

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  food:        { color: AMBER,        bg: Palette.warningLight },
  walk:        { color: Palette.info, bg: Palette.infoLight },
  medicine:    { color: PURPLE,       bg: '#EDE9FE' },
  grooming:    { color: TEAL,         bg: '#E0F2F1' },
  vaccination: { color: '#DB2777',    bg: '#FCE7F3' },
  general:     { color: Palette.gray[600], bg: Palette.gray[100] },
};

// ─── Options & Mappings ────────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: ActivityStatus; activeColor: string }[] = [
  { label: 'All',       value: 'all',       activeColor: 'brand' as any },
  { label: 'Completed', value: 'completed', activeColor: Palette.success },
  { label: 'Skipped',   value: 'skipped',   activeColor: RED },
];

const TYPE_OPTIONS: { label: string; value: ActivityType; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { label: 'All Types',  value: 'all',        icon: 'view-list' },
  { label: 'Feeding',    value: 'Feeding',    icon: 'silverware-fork-knife' },
  { label: 'Walks',      value: 'Walk',       icon: 'walk' },
  { label: 'Medicine',   value: 'Medicine',   icon: 'pill' },
  { label: 'Grooming',   value: 'Grooming',   icon: 'content-cut' },
  { label: 'Vaccines',   value: 'Vaccination',icon: 'needle' },
];

const DATE_LABELS: Record<DatePreset, string> = {
  all:       'All Time',
  today:     'Today',
  yesterday: 'Yesterday',
  last7:     '7 Days',
  last30:    '30 Days',
  custom:    'Custom',
};

const DATE_PRESETS: DatePreset[] = ['all', 'today', 'yesterday', 'last7', 'last30'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Type Dropdown Bottom Sheet ────────────────────────────────────────────────

function TypeSheet({
  visible,
  selected,
  brandColor,
  brandBg,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: ActivityType;
  brandColor: string;
  brandBg: string;
  onSelect: (v: ActivityType) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onClose} />
      <View style={sheet.panel}>
        <View style={sheet.handle} />
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text} style={sheet.sheetTitle}>
          Filter by Activity
        </AppText>
        {TYPE_OPTIONS.map((opt) => {
          const active = opt.value === selected;
          const category = mapActivityTypeToCategory(opt.value);
          const kind = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { onSelect(opt.value); onClose(); }}
              activeOpacity={0.75}
              style={[sheet.row, active && { backgroundColor: brandBg }]}
            >
              <View style={[sheet.rowIcon, { backgroundColor: active ? brandBg : kind.bg }]}>
                <MaterialCommunityIcons name={opt.icon} size={18} color={active ? brandColor : kind.color} />
              </View>
              <AppText variant="body" weight={active ? '700' : '500'} color={active ? brandColor : HomeTheme.text}>
                {opt.label}
              </AppText>
              {active ? <Ionicons name="checkmark" size={18} color={brandColor} style={{ marginLeft: 'auto' as any }} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

// ─── Date Dropdown Bottom Sheet ────────────────────────────────────────────────

function DateSheet({
  visible,
  selected,
  brandColor,
  brandBg,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: DatePreset;
  brandColor: string;
  brandBg: string;
  onSelect: (preset: DatePreset, range: DateRange) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onClose} />
      <View style={sheet.panel}>
        <View style={sheet.handle} />
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text} style={sheet.sheetTitle}>
          Date Range
        </AppText>
        {DATE_PRESETS.map((preset) => {
          const active = preset === selected;
          return (
            <TouchableOpacity
              key={preset}
              onPress={() => { onSelect(preset, getPresetRange(preset)); onClose(); }}
              activeOpacity={0.75}
              style={[sheet.row, active && { backgroundColor: brandBg }]}
            >
              <View style={[sheet.rowIcon, { backgroundColor: active ? brandBg : Palette.gray[100] }]}>
                <Ionicons name="calendar-outline" size={18} color={active ? brandColor : Palette.gray[500]} />
              </View>
              <AppText variant="body" weight={active ? '700' : '500'} color={active ? brandColor : HomeTheme.text}>
                {DATE_LABELS[preset]}
              </AppText>
              {active ? <Ionicons name="checkmark" size={18} color={brandColor} style={{ marginLeft: 'auto' as any }} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

// ─── Activity Card ─────────────────────────────────────────────────────────────

const ActivityCard = React.memo(function ActivityCard({
  entry,
  brandColor,
  brandBg,
}: {
  entry: ApiJournalEntry;
  brandColor: string;
  brandBg: string;
}) {
  const category = mapActivityTypeToCategory(entry.activityType);
  const icon = categoryToMaterialIcon(category) as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  const skipped = isEntrySkipped(entry);

  const date = new Date(entry.createdAt);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  let noteText = (entry.note || '').trim();
  if (noteText.length > 0) noteText = noteText.charAt(0).toUpperCase() + noteText.slice(1);

  const statusColor = skipped ? RED : Palette.success;
  const statusBg = skipped ? RED_L : Palette.successLight;
  const statusLabel = skipped ? 'SKIPPED' : 'COMPLETED';

  return (
    <View style={styles.card}>
      {/* Left stripe corresponds to status (Completed = green, Skipped = red) */}
      <View style={[styles.cardStripe, { backgroundColor: statusColor }]} />

      <View style={styles.cardBody}>
        {/* Brand themed icon box */}
        <View style={[styles.iconBox, { backgroundColor: brandBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={brandColor} />
        </View>

        {/* Text and Badges */}
        <View style={styles.cardText}>
          <View style={styles.cardTitleRow}>
            <AppText variant="bodySmall" weight="700" color={HomeTheme.text} style={styles.cardTitle} numberOfLines={1}>
              {entry.activityType || 'Activity'}
            </AppText>
            <View style={[styles.badge, { backgroundColor: statusBg }]}>
              <AppText variant="caption" weight="800" color={statusColor} style={styles.badgeText}>
                {statusLabel}
              </AppText>
            </View>
          </View>

          {/* Subtitle / Note */}
          {noteText ? (
            <AppText variant="caption" color={Palette.gray[600]} numberOfLines={2} style={styles.noteText}>
              {noteText}
            </AppText>
          ) : null}

          {/* Time row */}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color={Palette.gray[400]} />
            <AppText variant="caption" color={Palette.gray[500]} style={styles.timeText}>{timeStr}</AppText>
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
      <View style={[styles.sectionDot, { backgroundColor: isToday ? Palette.success : Palette.gray[300] }]} />
      <AppText
        variant="bodySmall"
        weight="700"
        color={isToday ? Palette.success : Palette.gray[600]}
        style={styles.sectionTitle}
      >
        {title}
      </AppText>
      <View style={styles.sectionLine} />
    </View>
  );
});

// ─── Empty State ───────────────────────────────────────────────────────────────

function ActivityEmptyState({
  onReset,
  hasFilters,
  brandColor,
  brandBg,
}: {
  onReset: () => void;
  hasFilters: boolean;
  brandColor: string;
  brandBg: string;
}) {
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconCircle, { backgroundColor: brandBg }]}>
        <MaterialCommunityIcons name="clipboard-text-clock-outline" size={38} color={brandColor} />
      </View>
      <AppText variant="h3" weight="700" color={HomeTheme.text} style={styles.emptyTitle}>
        No Activities Found
      </AppText>
      <AppText variant="bodySmall" color={Palette.gray[600]} align="center" style={styles.emptyDesc}>
        {hasFilters
          ? 'No activities match the selected filters.'
          : 'Completed pet care activities will appear here once logged.'}
      </AppText>
      {hasFilters ? (
        <TouchableOpacity onPress={onReset} style={[styles.resetBtn, { backgroundColor: brandColor }]} activeOpacity={0.8}>
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
  const { token, user } = useAuth();
  const { pet } = useActivePet(token);

  // Free vs Premium brand color mapping
  const isPremium = user?.premiumStatus === 'premium';
  const brandColor = isPremium ? Palette.premium.emerald : Palette.success;
  const brandBg    = isPremium ? Palette.premium.emeraldLight : Palette.successLight;

  const [type, setType] = useState<ActivityType>('all');
  const [status, setStatus] = useState<ActivityStatus>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

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
    <ActivityCard entry={item} brandColor={brandColor} brandBg={brandBg} />
  ), [brandColor, brandBg]);

  const renderSectionHeader = useCallback(({ section }: { section: DateSection }) => (
    <SectionDateHeader title={section.title} />
  ), []);

  const keyExtractor = useCallback((item: ApiJournalEntry) => item._id, []);

  const activeTypeName = TYPE_OPTIONS.find((t) => t.value === type)?.label ?? 'Type';
  const activeDateName = DATE_LABELS[datePreset] ?? 'Date';

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Activity History"
        variant="white"
        onBack={() => router.back()}
      />

      {/* Single-row filters header */}
      <View style={styles.filterHeaderWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* Status pills */}
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.value;
            const activeColor = opt.activeColor === 'brand' ? brandColor : opt.activeColor;
            const activeBg = opt.activeColor === 'brand' ? brandBg : `${opt.activeColor}15`;

            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.8}
                onPress={() => setStatus(opt.value)}
                style={[
                  styles.filterPill,
                  active
                    ? { backgroundColor: activeColor, borderColor: activeColor }
                    : { backgroundColor: '#FFF', borderColor: Palette.gray[200] },
                ]}
              >
                <AppText
                  variant="caption"
                  weight={active ? '700' : '600'}
                  color={active ? '#FFF' : Palette.gray[700]}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}

          <View style={styles.filterDivider} />

          {/* Type dropdown */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTypeSheetOpen(true)}
            style={[
              styles.dropdownButton,
              type !== 'all' && { backgroundColor: brandBg, borderColor: brandColor },
            ]}
          >
            <AppText
              variant="caption"
              weight={type !== 'all' ? '700' : '600'}
              color={type !== 'all' ? brandColor : Palette.gray[700]}
            >
              {activeTypeName}
            </AppText>
            <Ionicons
              name="chevron-down"
              size={12}
              color={type !== 'all' ? brandColor : Palette.gray[500]}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Date Range dropdown */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDateSheetOpen(true)}
            style={[
              styles.dropdownButton,
              datePreset !== 'all' && { backgroundColor: brandBg, borderColor: brandColor },
            ]}
          >
            <AppText
              variant="caption"
              weight={datePreset !== 'all' ? '700' : '600'}
              color={datePreset !== 'all' ? brandColor : Palette.gray[700]}
            >
              {activeDateName}
            </AppText>
            <Ionicons
              name="chevron-down"
              size={12}
              color={datePreset !== 'all' ? brandColor : Palette.gray[500]}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Clear button */}
          {hasFilters && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={resetFilters}
              style={styles.clearFiltersBtn}
            >
              <Ionicons name="close-circle" size={16} color={brandColor} />
              <AppText variant="caption" weight="700" color={brandColor}>
                Clear
              </AppText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            {/* Summary count row */}
            {!isLoading && items.length > 0 ? (
              <View style={styles.summaryRow}>
                <View style={[styles.summaryBadge, { backgroundColor: brandBg }]}>
                  <MaterialCommunityIcons name="history" size={13} color={brandColor} />
                  <AppText variant="caption" weight="700" color={brandColor} style={styles.summaryText}>
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
              <ActivityIndicator size="small" color={brandColor} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={brandColor} />
              <AppText variant="bodySmall" color={Palette.gray[400]} style={{ marginTop: Spacing.sm }}>
                Loading activities…
              </AppText>
            </View>
          ) : (
            <ActivityEmptyState
              onReset={resetFilters}
              hasFilters={hasFilters}
              brandColor={brandColor}
              brandBg={brandBg}
            />
          )
        }
      />

      {/* Sheets */}
      <TypeSheet
        visible={typeSheetOpen}
        selected={type}
        brandColor={brandColor}
        brandBg={brandBg}
        onSelect={setType}
        onClose={() => setTypeSheetOpen(false)}
      />

      <DateSheet
        visible={dateSheetOpen}
        selected={datePreset}
        brandColor={brandColor}
        brandBg={brandBg}
        onSelect={handleDateChange}
        onClose={() => setDateSheetOpen(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#1A2B4E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const sheet = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: Spacing.md,
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: Palette.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    marginBottom: Spacing.md,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6F8' },

  // ── Single-row filters header ─────────────────────────────────
  filterHeaderWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EAEAEA',
    paddingVertical: 8,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDivider: {
    width: 1,
    height: 18,
    backgroundColor: Palette.gray[300],
    marginHorizontal: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.gray[200],
    backgroundColor: '#FFFFFF',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 6,
    paddingRight: 4,
  },

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
  cardStripe: { width: 5 },
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
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText: { fontSize: 11 },

  // ── Empty / loader ───────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { marginBottom: Spacing.xs, textAlign: 'center' },
  emptyDesc: { lineHeight: 20, marginBottom: Spacing.lg, maxWidth: 260, textAlign: 'center' },
  resetBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderRadius: Radius.full,
  },
  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },
  centerLoader: { paddingVertical: Spacing.xxl, alignItems: 'center' },
});
