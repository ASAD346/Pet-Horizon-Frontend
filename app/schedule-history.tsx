import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Keyboard,
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
import { useScheduleHistory, type ScheduleHistoryFilters } from '@/hooks/useScheduleHistory';
import type {
  ScheduleHistoryStatus,
  ScheduleHistoryType,
  ScheduleHistoryItem,
} from '@/services/schedules/scheduleHistoryApi';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

// ─── Category colours (independent of free/premium brand) ─────────────────────

const AMBER  = Palette.warning;         // '#F57C00'
const RED    = Palette.error;           // '#D32F2F'
const RED_L  = Palette.errorLight;      // '#FFEBEE'
const PURPLE = '#7C3AED';
const TEAL   = HomeTheme.teal;          // '#00695C'

const KIND_COLORS: Record<string, { color: string; bg: string }> = {
  feeding:     { color: AMBER,        bg: Palette.warningLight },
  walk:        { color: Palette.info, bg: Palette.infoLight },
  medicine:    { color: PURPLE,       bg: '#EDE9FE' },
  grooming:    { color: TEAL,         bg: '#E0F2F1' },
  vaccination: { color: '#DB2777',    bg: '#FCE7F3' },
};

const KIND_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  feeding:     'silverware-fork-knife',
  walk:        'walk',
  medicine:    'pill',
  grooming:    'content-cut',
  vaccination: 'needle',
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'PENDING',   color: AMBER,             bg: Palette.warningLight },
  done:     { label: 'COMPLETED', color: Palette.success,   bg: Palette.successLight },
  skipped:  { label: 'SKIPPED',   color: RED,               bg: RED_L },
  disabled: { label: 'DISABLED',  color: Palette.gray[600], bg: Palette.gray[100] },
  upcoming: { label: 'UPCOMING',  color: PURPLE,            bg: '#EDE9FE' },
};

const STATUS_ACCENT: Record<string, string> = {
  pending:  AMBER,
  done:     Palette.success,
  skipped:  RED,
  disabled: Palette.gray[400],
  upcoming: PURPLE,
};

// Status chips — use brand color for "All" active state, unique colors for others
const STATUS_OPTIONS: {
  label: string;
  value: ScheduleHistoryStatus;
  activeColor: string;  // fill when active
  activeBg?: string;    // optional: derived from brand for 'all'
}[] = [
  { label: 'All',       value: 'all',      activeColor: 'brand' as any },
  { label: 'Pending',   value: 'pending',  activeColor: AMBER },
  { label: 'Done',      value: 'done',     activeColor: Palette.success },
  { label: 'Skipped',   value: 'skipped',  activeColor: RED },
  { label: 'Upcoming',  value: 'upcoming', activeColor: PURPLE },
  { label: 'Disabled',  value: 'disabled', activeColor: Palette.gray[500] },
];

const TYPE_OPTIONS: { label: string; value: ScheduleHistoryType; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { label: 'All Types',  value: 'all',        icon: 'view-list' },
  { label: 'Feeding',    value: 'feeding',    icon: 'silverware-fork-knife' },
  { label: 'Walk',       value: 'walk',       icon: 'walk' },
  { label: 'Medicine',   value: 'medicine',   icon: 'pill' },
  { label: 'Grooming',   value: 'grooming',   icon: 'content-cut' },
  { label: 'Vaccines',   value: 'vaccination',icon: 'needle' },
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

function formatTime(t?: string): string | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Type Sheet Modal ─────────────────────────────────────────────────────────

function TypeSheet({
  visible,
  selected,
  brandColor,
  brandBg,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: ScheduleHistoryType;
  brandColor: string;
  brandBg: string;
  onSelect: (v: ScheduleHistoryType) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onClose} />
      <View style={sheet.panel}>
        <View style={sheet.handle} />
        <AppText variant="bodySmall" weight="700" color={HomeTheme.text} style={sheet.sheetTitle}>
          Filter by Type
        </AppText>
        {TYPE_OPTIONS.map((opt) => {
          const active = opt.value === selected;
          const kind = KIND_COLORS[opt.value];
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { onSelect(opt.value); onClose(); }}
              activeOpacity={0.75}
              style={[sheet.row, active && { backgroundColor: brandBg }]}
            >
              <View style={[sheet.rowIcon, { backgroundColor: active ? brandBg : kind?.bg ?? Palette.gray[100] }]}>
                <MaterialCommunityIcons name={opt.icon} size={18} color={active ? brandColor : kind?.color ?? Palette.gray[600]} />
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

// ─── Date Sheet Modal ─────────────────────────────────────────────────────────

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

// ─── Stats Row ────────────────────────────────────────────────────────────────

const STAT_DEFS = [
  { key: 'total' as const,   label: 'Total',   value: 'all' as ScheduleHistoryStatus },
  { key: 'pending' as const, label: 'Pending', value: 'pending' as ScheduleHistoryStatus, color: AMBER, bg: Palette.warningLight },
  { key: 'done' as const,    label: 'Done',    value: 'done' as ScheduleHistoryStatus,    color: Palette.success, bg: Palette.successLight },
  { key: 'skipped' as const, label: 'Skipped', value: 'skipped' as ScheduleHistoryStatus, color: RED, bg: RED_L },
];

function StatsRow({
  stats,
  activeStatus,
  brandColor,
  brandBg,
  onPress,
}: {
  stats: Record<string, number>;
  activeStatus: ScheduleHistoryStatus;
  brandColor: string;
  brandBg: string;
  onPress: (v: ScheduleHistoryStatus) => void;
}) {
  return (
    <View style={styles.statsRow}>
      {STAT_DEFS.map((s) => {
        const active = activeStatus === s.value;
        const fillColor = s.value === 'all' ? brandColor : (s.color ?? brandColor);
        const fillBg    = s.value === 'all' ? brandBg    : (s.bg    ?? brandBg);
        return (
          <TouchableOpacity
            key={s.key}
            onPress={() => onPress(active && s.value !== 'all' ? 'all' : s.value)}
            activeOpacity={0.8}
            style={[
              styles.statBox,
              { backgroundColor: active ? fillColor : fillBg },
            ]}
          >
            <AppText variant="h3" weight="800" color={active ? '#FFF' : fillColor} style={styles.statNum}>
              {stats[s.key] ?? 0}
            </AppText>
            <AppText variant="caption" weight="600" color={active ? 'rgba(255,255,255,0.85)' : fillColor} style={styles.statLbl}>
              {s.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Schedule Card ────────────────────────────────────────────────────────────

const ScheduleCard = React.memo(function ScheduleCard({
  item,
  brandColor,
  brandBg,
}: {
  item: ScheduleHistoryItem;
  brandColor: string;
  brandBg: string;
}) {
  const kind   = KIND_COLORS[item.kind]    ?? { color: Palette.gray[600], bg: Palette.gray[100] };
  const icon   = KIND_ICONS[item.kind]     ?? 'calendar-check';
  const badge  = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending;
  const accent = STATUS_ACCENT[item.status] ?? Palette.gray[400];
  const timeLabel = formatTime(item.timeOfDay);
  const dateLabel = item.date
    ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <View style={styles.card}>
      <View style={[styles.cardStripe, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        <View style={[styles.iconBox, { backgroundColor: brandBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={brandColor} />
        </View>
        <View style={styles.cardText}>
          <View style={styles.cardTopRow}>
            <AppText variant="bodySmall" weight="700" color={HomeTheme.text} style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </AppText>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <AppText variant="caption" weight="800" color={badge.color} style={styles.badgeLbl}>
                {badge.label}
              </AppText>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.kindPill, { backgroundColor: kind.bg }]}>
              <MaterialCommunityIcons name={icon} size={9} color={kind.color} style={{ marginRight: 3 }} />
              <AppText variant="caption" weight="700" color={kind.color} style={styles.kindPillText}>
                {item.kind.charAt(0).toUpperCase() + item.kind.slice(1)}
              </AppText>
            </View>
            {timeLabel ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={10} color={Palette.gray[500]} />
                <AppText variant="caption" color={Palette.gray[600]} style={styles.metaChipText}>{timeLabel}</AppText>
              </View>
            ) : null}
            {dateLabel ? (
              <View style={styles.metaChip}>
                <Ionicons name="calendar-outline" size={10} color={Palette.gray[500]} />
                <AppText variant="caption" color={Palette.gray[600]} style={styles.metaChipText}>{dateLabel}</AppText>
              </View>
            ) : null}
          </View>

          {item.subtitle ? (
            <AppText variant="caption" color={Palette.gray[500]} numberOfLines={1} style={{ marginTop: 1 }}>
              {item.subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
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
      <View style={[styles.emptyCircle, { backgroundColor: brandBg }]}>
        <MaterialCommunityIcons name="calendar-search" size={36} color={brandColor} />
      </View>
      <AppText variant="h3" weight="700" color={HomeTheme.text} style={styles.emptyTitle}>
        No Schedules Found
      </AppText>
      <AppText variant="bodySmall" color={Palette.gray[600]} style={styles.emptyDesc}>
        {hasFilters ? 'No schedules match the selected filters.' : 'No schedule records are available yet.'}
      </AppText>
      {hasFilters ? (
        <TouchableOpacity onPress={onReset} style={[styles.clearBtn, { backgroundColor: brandColor }]} activeOpacity={0.85}>
          <AppText variant="bodySmall" weight="700" color="#FFF">Clear Filters</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScheduleHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token, user } = useAuth();
  const { pet } = useActivePet(token);

  // ── Brand color (free vs premium) — same pattern as all other screens
  const isPremium = user?.premiumStatus === 'premium';
  const brandColor = isPremium ? Palette.premium.emerald : Palette.success;
  const brandBg    = isPremium ? Palette.premium.emeraldLight : Palette.successLight;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ScheduleHistoryStatus>('all');
  const [type, setType] = useState<ScheduleHistoryType>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filters: ScheduleHistoryFilters = {
    status, type, datePreset, customRange, search: debouncedSearch,
  };

  const { items, stats, total, isLoading, loadMore } = useScheduleHistory(token, pet?._id, filters);

  const hasFilters = status !== 'all' || type !== 'all' || datePreset !== 'all' || !!debouncedSearch;

  const resetFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('all');
    setType('all');
    setDatePreset('all');
    setCustomRange(undefined);
  }, []);

  const handleDateChange = useCallback((preset: DatePreset, range: DateRange) => {
    setDatePreset(preset);
    setCustomRange(preset === 'custom' ? range : undefined);
  }, []);

  const renderItem = useCallback(({ item }: { item: ScheduleHistoryItem }) => (
    <ScheduleCard item={item} brandColor={brandColor} brandBg={brandBg} />
  ), [brandColor, brandBg]);

  const keyExtractor = useCallback((item: ScheduleHistoryItem) => item._id, []);

  const statsRecord: Record<string, number> = {
    total: stats.total, pending: stats.pending, done: stats.done, skipped: stats.skipped,
  };

  const ListHeader = useMemo(() => (
    <View>
      <StatsRow
        stats={statsRecord}
        activeStatus={status}
        brandColor={brandColor}
        brandBg={brandBg}
        onPress={setStatus}
      />
      {!isLoading && items.length > 0 ? (
        <View style={styles.countRow}>
          <AppText variant="caption" color={Palette.gray[500]}>
            {items.length} result{items.length !== 1 ? 's' : ''}
            {total > items.length ? ` of ${total}` : ''}
          </AppText>
        </View>
      ) : null}
    </View>
  ), [statsRecord, status, brandColor, brandBg, isLoading, items.length, total]);

  const activeTypeName = TYPE_OPTIONS.find((t) => t.value === type)?.label ?? 'Type';
  const activeDateName = DATE_LABELS[datePreset] ?? 'Date';

  return (
    <View style={styles.root}>
      <ScreenHeader title="Schedule History" variant="white" onBack={() => router.back()} />

      {/* ── Filter shell — SEARCH + ONE ROW ONLY ─────────────────────── */}
      <View style={styles.filterShell}>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color={Palette.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search schedules…"
            placeholderTextColor={Palette.gray[400]}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && Platform.OS !== 'ios' ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={15} color={Palette.gray[400]} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── SINGLE filter row: status pills + Type btn + Date btn ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.singleFilterRow}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status pills */}
          {STATUS_OPTIONS.map((opt) => {
            const active = opt.value === status;
            const fillColor = (opt.activeColor as string) === 'brand' ? brandColor : opt.activeColor as string;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                activeOpacity={0.75}
                style={[
                  styles.pill,
                  active
                    ? { backgroundColor: fillColor, borderColor: fillColor }
                    : styles.pillOff,
                ]}
              >
                <AppText
                  variant="caption"
                  weight={active ? '700' : '500'}
                  color={active ? '#FFF' : Palette.gray[700]}
                  style={styles.pillText}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Type button */}
          <TouchableOpacity
            onPress={() => setTypeSheetOpen(true)}
            activeOpacity={0.75}
            style={[
              styles.pill,
              styles.iconPill,
              type !== 'all'
                ? { backgroundColor: brandColor, borderColor: brandColor }
                : styles.pillOff,
            ]}
          >
            <MaterialCommunityIcons
              name={TYPE_OPTIONS.find((t) => t.value === type)?.icon ?? 'view-list'}
              size={12}
              color={type !== 'all' ? '#FFF' : Palette.gray[600]}
              style={{ marginRight: 4 }}
            />
            <AppText
              variant="caption"
              weight={type !== 'all' ? '700' : '500'}
              color={type !== 'all' ? '#FFF' : Palette.gray[700]}
              style={styles.pillText}
            >
              {type !== 'all' ? activeTypeName : 'Type'}
            </AppText>
            <Ionicons
              name="chevron-down"
              size={10}
              color={type !== 'all' ? '#FFF' : Palette.gray[500]}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>

          {/* Date button */}
          <TouchableOpacity
            onPress={() => setDateSheetOpen(true)}
            activeOpacity={0.75}
            style={[
              styles.pill,
              styles.iconPill,
              datePreset !== 'all'
                ? { backgroundColor: brandColor, borderColor: brandColor }
                : styles.pillOff,
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={12}
              color={datePreset !== 'all' ? '#FFF' : Palette.gray[600]}
              style={{ marginRight: 4 }}
            />
            <AppText
              variant="caption"
              weight={datePreset !== 'all' ? '700' : '500'}
              color={datePreset !== 'all' ? '#FFF' : Palette.gray[700]}
              style={styles.pillText}
            >
              {datePreset !== 'all' ? activeDateName : 'Date'}
            </AppText>
            <Ionicons
              name="chevron-down"
              size={10}
              color={datePreset !== 'all' ? '#FFF' : Palette.gray[500]}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>

          {/* Clear all — only when any filter active */}
          {hasFilters ? (
            <TouchableOpacity
              onPress={resetFilters}
              activeOpacity={0.75}
              style={[styles.pill, styles.clearPill]}
            >
              <Ionicons name="close" size={11} color={RED} style={{ marginRight: 3 }} />
              <AppText variant="caption" weight="600" color={RED} style={styles.pillText}>
                Clear
              </AppText>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>

      {/* ── List ─────────────────────────────────────────────────────── */}
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
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
              <AppText variant="bodySmall" color={Palette.gray[500]} style={{ marginTop: Spacing.sm }}>
                Loading…
              </AppText>
            </View>
          ) : (
            <EmptyState onReset={resetFilters} hasFilters={hasFilters} brandColor={brandColor} brandBg={brandBg} />
          )
        }
      />

      {/* ── Bottom sheet modals ───────────────────────────────────────── */}
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
  ios:     { shadowColor: '#1A2B4E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HomeTheme.background },

  // ── Filter shell ──────────────────────────────────────────────────
  filterShell: {
    backgroundColor: HomeTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray[200],
    paddingBottom: Spacing.sm,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Palette.gray[100],
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.gray[200],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
  },
  searchInput: { flex: 1, fontSize: 13, color: HomeTheme.text, padding: 0 },

  // SINGLE filter row — all in one horizontal scroll
  singleFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 6,
    paddingBottom: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  pillOff: {
    backgroundColor: Palette.gray[50],
    borderColor: Palette.gray[200],
  },
  pillText: { fontSize: 12, letterSpacing: 0.1 },
  iconPill: { paddingHorizontal: 10 },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Palette.gray[200],
    marginHorizontal: 2,
  },
  clearPill: {
    backgroundColor: Palette.errorLight,
    borderColor: Palette.error,
  },

  // ── Stats row ─────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  statBox: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  statNum: { fontSize: 22, lineHeight: 26, fontWeight: '800' },
  statLbl: { fontSize: 9, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },
  countRow: { paddingHorizontal: Spacing.md, paddingBottom: 4 },

  // ── List ─────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },

  // ── Card ─────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  cardStripe: { width: 4 },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  iconBox: {
    width: 42, height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 3 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  cardTitle: { flex: 1, fontSize: 14 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  badgeLbl: { fontSize: 8, letterSpacing: 0.6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  kindPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.xs,
  },
  kindPillText: { fontSize: 9, letterSpacing: 0.4, textTransform: 'uppercase' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaChipText: { fontSize: 11 },

  // ── Empty / loader ────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  emptyCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { marginBottom: Spacing.xs, textAlign: 'center' },
  emptyDesc: { lineHeight: 20, marginBottom: Spacing.lg, maxWidth: 260, textAlign: 'center' },
  clearBtn: { paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.full },
  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },
  centerLoader: { paddingVertical: Spacing.xxl, alignItems: 'center' },
});

// ─── Bottom Sheet styles (shared between TypeSheet and DateSheet) ─────────────

const sheet = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: HomeTheme.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    paddingTop: Spacing.sm,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: Palette.gray[300],
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    marginBottom: Spacing.md,
    fontSize: 15,
    color: HomeTheme.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    marginBottom: 4,
  },
  rowIcon: {
    width: 36, height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
