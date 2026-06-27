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
import { SkeletonScheduleSections } from '@/components/ui/skeletons';

import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { useScheduleHistory, type ScheduleHistoryFilters } from '@/hooks/useScheduleHistory';
import type {
  ScheduleHistoryStatus,
  ScheduleHistoryType,
  ScheduleHistoryItem,
} from '@/services/schedules/scheduleHistoryApi';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

// ─── Color Palette ────────────────────────────────────────────────────────────
const AMBER  = '#D97706';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';
const TEAL   = '#0F766E';
const GREEN  = '#16A34A';

const KIND_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  feeding:     { color: AMBER,        bg: '#FEF3C7', icon: 'silverware-fork-knife' },
  walk:        { color: '#2563EB',    bg: '#DBEAFE', icon: 'walk' },
  medicine:    { color: PURPLE,       bg: '#F3E8FF', icon: 'pill' },
  grooming:    { color: TEAL,         bg: '#CCFBF1', icon: 'content-cut' },
  vaccination: { color: '#DB2777',    bg: '#FCE7F3', icon: 'needle' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:  { label: 'Pending',   color: AMBER,             dot: AMBER },
  done:     { label: 'Completed', color: GREEN,             dot: GREEN },
  skipped:  { label: 'Skipped',   color: RED,               dot: RED },
  disabled: { label: 'Disabled',  color: Palette.gray[500], dot: Palette.gray[400] },
  upcoming: { label: 'Upcoming',  color: PURPLE,            dot: PURPLE },
};

const DATE_LABELS: Record<DatePreset, string> = {
  all:       'All Time',
  today:     'Today',
  yesterday: 'Yesterday',
  last7:     '7 Days',
  last30:    '30 Days',
  custom:    'Custom',
};

function formatTime(t?: string): string | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Unified Filter Bottom Sheet ──────────────────────────────────────────────
function FilterSheet({
  visible,
  filters,
  brandColor,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: { status: ScheduleHistoryStatus; type: ScheduleHistoryType; datePreset: DatePreset };
  brandColor: string;
  onApply: (updates: { status: ScheduleHistoryStatus; type: ScheduleHistoryType; datePreset: DatePreset }) => void;
  onClose: () => void;
}) {
  const [tempStatus, setTempStatus] = useState<ScheduleHistoryStatus>(filters.status);
  const [tempType, setTempType] = useState<ScheduleHistoryType>(filters.type);
  const [tempDate, setTempDate] = useState<DatePreset>(filters.datePreset);

  useEffect(() => {
    if (visible) {
      setTempStatus(filters.status);
      setTempType(filters.type);
      setTempDate(filters.datePreset);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply({ status: tempStatus, type: tempType, datePreset: tempDate });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onClose} />
      <View style={sheet.panel}>
        <View style={sheet.handle} />
        
        <View style={sheet.headerRow}>
          <AppText variant="body" weight="800" color={HomeTheme.text}>
            Filter Options
          </AppText>
          <TouchableOpacity onPress={() => {
            setTempStatus('all');
            setTempType('all');
            setTempDate('all');
          }}>
            <AppText variant="caption" weight="700" color={RED}>
              Reset All
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={sheet.scrollArea}>
          {/* Status Segment */}
          <AppText variant="caption" weight="800" color={Palette.gray[500]} style={sheet.sectionTitle}>
            STATUS
          </AppText>
          <View style={sheet.gridRow}>
            {(['all', 'pending', 'done', 'skipped'] as const).map((s) => {
              const active = tempStatus === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setTempStatus(s)}
                  style={[sheet.gridItem, active && { backgroundColor: '#F3F4F6', borderColor: brandColor }]}
                >
                  <AppText variant="caption" weight="700" color={active ? brandColor : HomeTheme.text} style={{ textTransform: 'capitalize' }}>
                    {s === 'all' ? 'All Status' : s === 'done' ? 'Completed' : s}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Type Segment */}
          <AppText variant="caption" weight="800" color={Palette.gray[500]} style={sheet.sectionTitle}>
            CATEGORY
          </AppText>
          <View style={sheet.gridRow}>
            {(['all', 'feeding', 'walk', 'medicine', 'grooming', 'vaccination'] as const).map((t) => {
              const active = tempType === t;
              const config = KIND_CONFIG[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTempType(t)}
                  style={[sheet.gridItem, active && { backgroundColor: '#F3F4F6', borderColor: brandColor }]}
                >
                  <AppText variant="caption" weight="700" color={active ? brandColor : HomeTheme.text} style={{ textTransform: 'capitalize' }}>
                    {t === 'all' ? 'All Categories' : t === 'vaccination' ? 'Vaccines' : t}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date Segment */}
          <AppText variant="caption" weight="800" color={Palette.gray[500]} style={sheet.sectionTitle}>
            DATE RANGE
          </AppText>
          <View style={sheet.gridRow}>
            {(['all', 'today', 'yesterday', 'last7', 'last30'] as const).map((d) => {
              const active = tempDate === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setTempDate(d)}
                  style={[sheet.gridItem, active && { backgroundColor: '#F3F4F6', borderColor: brandColor }]}
                >
                  <AppText variant="caption" weight="700" color={active ? brandColor : HomeTheme.text}>
                    {DATE_LABELS[d]}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity onPress={handleApply} style={[sheet.applyBtn, { backgroundColor: brandColor }]} activeOpacity={0.85}>
          <AppText variant="bodySmall" weight="800" color="#FFF">Apply Filters</AppText>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Premium Listing Card ─────────────────────────────────────────────────────
const ScheduleCard = React.memo(function ScheduleCard({ item }: { item: ScheduleHistoryItem }) {
  const config = KIND_CONFIG[item.kind] ?? { color: Palette.gray[600], bg: '#F3F4F6', icon: 'calendar-check' };
  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
  const timeLabel = formatTime(item.timeOfDay);
  const dateLabel = item.date
    ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        {/* Soft, clean monochromatic circle container */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={config.icon} size={18} color="#4B5563" />
        </View>
        
        <View style={styles.cardInfo}>
          <AppText variant="body" weight="700" color={HomeTheme.text} style={styles.cardTitle}>
            {item.title}
          </AppText>
          
          <View style={styles.metaRow}>
            <AppText variant="caption" weight="700" color={Palette.gray[400]} style={styles.kindLabel}>
              {item.kind.toUpperCase()}
            </AppText>
            {timeLabel && (
              <AppText variant="caption" color={Palette.gray[400]}>•  {timeLabel}</AppText>
            )}
            {dateLabel && (
              <AppText variant="caption" color={Palette.gray[400]}>•  {dateLabel}</AppText>
            )}
          </View>

          {item.subtitle ? (
            <AppText variant="caption" color={Palette.gray[400]} numberOfLines={1} style={{ marginTop: 2 }}>
              {item.subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* Clean Status Dot & Label on the right */}
      <View style={styles.cardRight}>
        <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
        <AppText variant="caption" weight="800" color={status.color} style={styles.statusText}>
          {status.label.toUpperCase()}
        </AppText>
      </View>
    </View>
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onReset, hasFilters, brandColor }: { onReset: () => void; hasFilters: boolean; brandColor: string }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCircle}>
        <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
      </View>
      <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.emptyTitle}>
        No Records Found
      </AppText>
      <AppText variant="bodySmall" color={Palette.gray[400]} style={styles.emptyDesc}>
        {hasFilters ? 'No activities match the filters selected. Try resetting them.' : 'No schedules have been logged yet.'}
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

  const isPremium = user?.premiumStatus === 'premium';
  const brandColor = isPremium ? Palette.premium.emerald : Palette.success;
  const brandBg    = isPremium ? Palette.premium.emeraldLight : Palette.successLight;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ScheduleHistoryStatus>('all');
  const [type, setType] = useState<ScheduleHistoryType>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filters: ScheduleHistoryFilters = {
    status, type, datePreset, customRange, search: debouncedSearch,
  };

  const { items, stats, total, isLoading, loadMore } = useScheduleHistory(token, pet?._id, filters);

  const hasFilters = status !== 'all' || type !== 'all' || datePreset !== 'all';

  const resetFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('all');
    setType('all');
    setDatePreset('all');
    setCustomRange(undefined);
  }, []);

  const handleApplyFilters = (updates: { status: ScheduleHistoryStatus; type: ScheduleHistoryType; datePreset: DatePreset }) => {
    setStatus(updates.status);
    setType(updates.type);
    setDatePreset(updates.datePreset);
  };

  const renderItem = useCallback(({ item }: { item: ScheduleHistoryItem }) => (
    <ScheduleCard item={item} />
  ), []);

  const keyExtractor = useCallback((item: ScheduleHistoryItem) => item._id, []);

  return (
    <View style={styles.root}>
      <ScreenHeader title="History" variant="white" onBack={() => router.back()} />

      {/* ── Search & Filter Options Row ── */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search history..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              clearButtonMode="while-editing"
            />
          </View>
          
          <TouchableOpacity
            style={[styles.filterIconBtn, hasFilters && { backgroundColor: brandBg, borderColor: brandColor }]}
            activeOpacity={0.8}
            onPress={() => setFilterSheetOpen(true)}
          >
            <Ionicons name="options-outline" size={18} color={hasFilters ? brandColor : '#4B5563'} />
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips */}
        {hasFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeChipsContainer}>
            {status !== 'all' && (
              <View style={styles.filterChip}>
                <AppText variant="caption" weight="700" color="#4B5563">
                  Status: {status === 'done' ? 'Completed' : status}
                </AppText>
                <TouchableOpacity onPress={() => setStatus('all')} style={styles.chipClose}>
                  <Ionicons name="close" size={10} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            {type !== 'all' && (
              <View style={styles.filterChip}>
                <AppText variant="caption" weight="700" color="#4B5563">
                  Category: {type === 'vaccination' ? 'Vaccines' : type}
                </AppText>
                <TouchableOpacity onPress={() => setType('all')} style={styles.chipClose}>
                  <Ionicons name="close" size={10} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            {datePreset !== 'all' && (
              <View style={styles.filterChip}>
                <AppText variant="caption" weight="700" color="#4B5563">
                  Date: {DATE_LABELS[datePreset]}
                </AppText>
                <TouchableOpacity onPress={() => setDatePreset('all')} style={styles.chipClose}>
                  <Ionicons name="close" size={10} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={resetFilters} style={styles.clearAllBtn}>
              <AppText variant="caption" weight="800" color={RED}>Clear All</AppText>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ── List ── */}
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
        ListFooterComponent={
          isLoading && items.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={brandColor} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ flex: 1, padding: Spacing.md }}>
              <SkeletonScheduleSections />
            </View>
          ) : (
            <EmptyState onReset={resetFilters} hasFilters={hasFilters} brandColor={brandColor} />
          )
        }
      />

      <FilterSheet
        visible={filterSheetOpen}
        filters={{ status, type, datePreset }}
        brandColor={brandColor}
        onApply={handleApplyFilters}
        onClose={() => setFilterSheetOpen(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFB' },
  
  topFilterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: Spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: HomeTheme.text, padding: 0 },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  
  activeChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 8,
    paddingVertical: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipClose: {
    padding: 2,
  },
  clearAllBtn: {
    paddingHorizontal: 4,
  },

  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  
  // Clean, border-only Revolut style listing card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  kindLabel: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },

  emptyWrap: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { marginBottom: Spacing.xs, textAlign: 'center', fontSize: 16 },
  emptyDesc: { lineHeight: 18, marginBottom: Spacing.lg, maxWidth: 240, textAlign: 'center' },
  clearBtn: { paddingHorizontal: Spacing.xl, paddingVertical: 10, borderRadius: Radius.full },
  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },
});

const sheet = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: 32,
    paddingTop: Spacing.sm,
    maxHeight: '75%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 32, height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  scrollArea: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  gridItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  applyBtn: {
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
