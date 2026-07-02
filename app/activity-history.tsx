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
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/ui/AppText';
import { getPresetRange, type DatePreset, type DateRange } from '@/components/ui/DateFilterBar';
import { Spacing, Radius, Palette, HomeTheme } from '@/constants/theme';
import { SkeletonJournalScreen } from '@/components/ui/skeletons';

import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { useActivityHistory, type ActivityHistoryFilters } from '@/hooks/useActivityHistory';
import type { ActivityType, ActivityStatus } from '@/services/journal/activityHistoryApi';
import type { ApiJournalEntry } from '@/types/journal';
import { mapActivityTypeToCategory, categoryToMaterialIcon } from '@/lib/journal/journalMappers';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

// ─── Color Palette & Config ───────────────────────────────────────────────────
const RED    = '#DC2626';
const GREEN  = '#16A34A';

const KIND_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  food:        { color: '#E57373', bg: '#FFEBEE', icon: 'silverware-fork-knife' },
  walk:        { color: '#F5A623', bg: '#FFF8E1', icon: 'walk' },
  medicine:    { color: '#5B9BD5', bg: '#E3F2FD', icon: 'pill' },
  grooming:    { color: '#E91E8C', bg: '#FCE4F0', icon: 'content-cut' },
  vaccination: { color: '#673AB7', bg: '#EDE7F6', icon: 'needle' },
  general:     { color: '#757575', bg: '#F0F0F0', icon: 'clipboard-text' },
};

const DATE_LABELS: Record<DatePreset, string> = {
  all:       'All Time',
  today:     'Today',
  yesterday: 'Yesterday',
  last7:     '7 Days',
  last30:    '30 Days',
  custom:    'Custom',
};

interface DateSection {
  title: string;
  data: ApiJournalEntry[];
}

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

// ─── Unified Filter Bottom Sheet ──────────────────────────────────────────────
function FilterSheet({
  visible,
  filters,
  brandColor,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: { status: ActivityStatus; type: ActivityType; datePreset: DatePreset };
  brandColor: string;
  onApply: (updates: { status: ActivityStatus; type: ActivityType; datePreset: DatePreset }) => void;
  onClose: () => void;
}) {
  const [tempStatus, setTempStatus] = useState<ActivityStatus>(filters.status);
  const [tempType, setTempType] = useState<ActivityType>(filters.type);
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
            {(['all', 'completed', 'skipped'] as const).map((s) => {
              const active = tempStatus === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setTempStatus(s)}
                  style={[sheet.gridItem, active && { backgroundColor: '#F3F4F6', borderColor: brandColor }]}
                >
                  <AppText variant="caption" weight="700" color={active ? brandColor : HomeTheme.text} style={{ textTransform: 'capitalize' }}>
                    {s === 'all' ? 'All Status' : s}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Type Segment */}
          <AppText variant="caption" weight="800" color={Palette.gray[500]} style={sheet.sectionTitle}>
            ACTIVITY TYPE
          </AppText>
          <View style={sheet.gridRow}>
            {(['all', 'Feeding', 'Walk', 'Medicine', 'Grooming', 'Vaccination'] as const).map((t) => {
              const active = tempType === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTempType(t)}
                  style={[sheet.gridItem, active && { backgroundColor: '#F3F4F6', borderColor: brandColor }]}
                >
                  <AppText variant="caption" weight="700" color={active ? brandColor : HomeTheme.text}>
                    {t === 'all' ? 'All Activities' : t === 'Vaccination' ? 'Vaccines' : t}
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
const ActivityCard = React.memo(function ActivityCard({
  entry,
  brandColor,
  brandBg,
  isPremium = false,
}: {
  entry: ApiJournalEntry;
  brandColor: string;
  brandBg: string;
  isPremium?: boolean;
}) {
  const category = mapActivityTypeToCategory(entry.activityType).toLowerCase();
  const config = KIND_CONFIG[category] ?? KIND_CONFIG.general;
  const skipped = isEntrySkipped(entry);

  const date = new Date(entry.createdAt);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  let noteText = (entry.note || '').trim();
  if (noteText.length > 0) noteText = noteText.charAt(0).toUpperCase() + noteText.slice(1);

  const statusColor = skipped ? RED : GREEN;
  const statusLabel = skipped ? 'SKIPPED' : 'COMPLETED';

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold border for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border for free

  return (
    <View style={[styles.card, { borderColor: cardBorderColor }]}>
      <View style={styles.cardLeft}>
        {/* Uniform brand-colored icon container */}
        <View style={[styles.iconContainer, { backgroundColor: brandBg }]}>
          <MaterialCommunityIcons name={config.icon} size={18} color={brandColor} />
        </View>
        
        <View style={styles.cardInfo}>
          <AppText variant="body" weight="700" color={HomeTheme.text} style={styles.cardTitle}>
            {entry.activityType || 'Activity'}
          </AppText>
          
          <View style={styles.metaRow}>
            <AppText variant="caption" weight="800" color={brandColor} style={styles.kindLabel}>
              {category.toUpperCase()}
            </AppText>
            <AppText variant="caption" color={Palette.gray[400]}>•  {timeStr}</AppText>
          </View>

          {noteText ? (
            <AppText variant="caption" color={Palette.gray[400]} numberOfLines={2} style={{ marginTop: 2, lineHeight: 14 }}>
              {noteText}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* Clean Status Dot & Label on the right */}
      <View style={styles.cardRight}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <AppText variant="caption" weight="800" color={statusColor} style={styles.statusText}>
          {statusLabel}
        </AppText>
      </View>
    </View>
  );
});

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionDateHeader = React.memo(function SectionDateHeader({ title, brandColor }: { title: string; brandColor: string }) {
  const isToday = title === 'Today';
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: isToday ? brandColor : Palette.gray[300] }]} />
      <AppText
        variant="caption"
        weight="800"
        color={isToday ? brandColor : Palette.gray[500]}
        style={styles.sectionTitleText}
      >
        {title.toUpperCase()}
      </AppText>
      <View style={styles.sectionLine} />
    </View>
  );
});

// ─── Empty State ───────────────────────────────────────────────────────────────
function ActivityEmptyState({ onReset, hasFilters, brandColor }: { onReset: () => void; hasFilters: boolean; brandColor: string }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCircle}>
        <Ionicons name="clipboard-outline" size={32} color="#9CA3AF" />
      </View>
      <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.emptyTitle}>
        {hasFilters ? 'No Matches Found' : 'No Activity Yet'}
      </AppText>
      <AppText variant="bodySmall" color={Palette.gray[400]} style={styles.emptyDesc}>
        {hasFilters
          ? 'None of your logged activities match the selected filters. Try adjusting or clearing them.'
          : 'Logged pet care activities — feedings, walks, medication, and more — will appear here.'}
      </AppText>
      {hasFilters ? (
        <TouchableOpacity onPress={onReset} style={[styles.clearBtn, { backgroundColor: brandColor }]} activeOpacity={0.85}>
          <AppText variant="bodySmall" weight="700" color="#FFF">Reset Filters</AppText>
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

  const isPremium = user?.premiumStatus === 'premium';
  
  // Custom curved header config
  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const brandColor = isPremium ? Palette.premium.emerald : Palette.success;
  const brandBg    = isPremium ? Palette.premium.emeraldLight : Palette.successLight;
  const screenBg   = isPremium ? '#F4F8F6' : '#F5F6F8';
  const shadowColor = isPremium ? '#082113' : '#1B5E20';

  const [type, setType] = useState<ActivityType>('all');
  const [status, setStatus] = useState<ActivityStatus>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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

  const handleApplyFilters = (updates: { status: ActivityStatus; type: ActivityType; datePreset: DatePreset }) => {
    setStatus(updates.status);
    setType(updates.type);
    setDatePreset(updates.datePreset);
  };

  const sections = useMemo(() => groupByDate(items), [items]);

  const renderItem = useCallback(({ item }: { item: ApiJournalEntry }) => (
    <ActivityCard entry={item} brandColor={brandColor} brandBg={brandBg} isPremium={isPremium} />
  ), [brandColor, brandBg, isPremium]);

  const renderSectionHeader = useCallback(({ section }: { section: DateSection }) => (
    <SectionDateHeader title={section.title} brandColor={brandColor} />
  ), [brandColor]);

  const keyExtractor = useCallback((item: ApiJournalEntry) => item._id, []);

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      {/* Premium Branded Header matching other beautiful headers with bottom curve */}
      <View style={[styles.headerWrapper, { shadowColor }]}>
        <View style={styles.curveClipper}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, { paddingTop: Math.max(insets.top, Spacing.sm) + 8 }]}
          >
            {/* Decorative background rings */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.bgRing1} />
              <View style={styles.bgRing2} />
            </View>

            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.headerTitle}>
                Activity History
              </AppText>
              <View style={{ width: 40 }} />
            </View>
            
            {/* Bottom accent line */}
            <View style={[
              styles.headerDivider,
              isPremium && { backgroundColor: 'rgba(212, 160, 23, 0.3)' },
            ]} />
          </LinearGradient>
        </View>
      </View>

      {/* ── Search & Filter Options Row ── */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
              placeholderTextColor="#9CA3AF"
              editable={false} // Match previous functionality: filter-only
              value={type !== 'all' ? `Category: ${type}` : "All Activities"}
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
                  Status: {status}
                </AppText>
                <TouchableOpacity onPress={() => setStatus('all')} style={styles.chipClose}>
                  <Ionicons name="close" size={10} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            {type !== 'all' && (
              <View style={styles.filterChip}>
                <AppText variant="caption" weight="700" color="#4B5563">
                  Category: {type === 'Vaccination' ? 'Vaccines' : type}
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

      {/* ── Sectioned List ── */}
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
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
              <SkeletonJournalScreen />
            </View>
          ) : (
            <ActivityEmptyState onReset={resetFilters} hasFilters={hasFilters} brandColor={brandColor} />
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
  root: { flex: 1 },
  
  headerWrapper: {
    width: '100%',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  curveClipper: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#F5F6F8',
  },
  headerGradient: {
    paddingBottom: 0,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
  },
  bgRing1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -40,
  },
  bgRing2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

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
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitleText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
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
