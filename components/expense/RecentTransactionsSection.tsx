import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from '../home/ColorIconBadge';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { SkeletonList } from '@/components/ui/skeletons';
import { homePillCard } from '../home/homeStyles';
import { useLocalization } from '@/hooks/useLocalization';
import { useTimezone } from '@/hooks/useTimezone';
import { formatInTimeZone, parseSafeDate } from '@/lib/timezone';
import { EmptyState } from '../ui/EmptyState';
import { AnimatedStackItem } from '../ui/AnimatedStackItem';
import type { ExpenseTrackerCategory, ExpenseTransaction } from './expenseTrackerData';
import { getExpenseTimestamp } from './expenseTrackerData';

const BRAND_GREEN = '#2E7D32';
const INITIAL_LIMIT = 5;

export type TimeFilter = 'today' | 'week' | 'month';

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

interface RecentTransactionsSectionProps {
  categoryFilter: ExpenseTrackerCategory;
  transactions: ExpenseTransaction[];
  loading?: boolean;
  isPremium?: boolean;
  onAddExpensePress?: () => void;
}

function filterTransactions(
  items: ExpenseTransaction[],
  categoryFilter: ExpenseTrackerCategory,
  timeFilter: TimeFilter,
  timezone: string,
): ExpenseTransaction[] {
  let result = items;
  if (categoryFilter !== 'all') {
    result = result.filter((item) => item.category === categoryFilter);
  }
  if (timeFilter === 'month') {
    return result;
  }

  const now = new Date();
  const todayStr = formatInTimeZone(now, timezone, 'yyyy-MM-dd');

  if (timeFilter === 'today') {
    return result.filter((item) => {
      if (!item.expenseDate) return false;
      const itemDateStr = formatInTimeZone(item.expenseDate, timezone, 'yyyy-MM-dd');
      return itemDateStr === todayStr;
    });
  }

  if (timeFilter === 'week') {
    // Start of week (Monday) in timezone
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const mondayStr = formatInTimeZone(monday, timezone, 'yyyy-MM-dd');

    // End of week (Sunday) in timezone
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = formatInTimeZone(sunday, timezone, 'yyyy-MM-dd');

    return result.filter((item) => {
      if (!item.expenseDate) return true;
      const itemDateStr = formatInTimeZone(item.expenseDate, timezone, 'yyyy-MM-dd');
      return itemDateStr >= mondayStr && itemDateStr <= sundayStr;
    });
  }

  return result;
}

export function RecentTransactionsSection({
  categoryFilter,
  transactions,
  loading,
  isPremium = false,
  onAddExpensePress,
}: RecentTransactionsSectionProps) {
  const router = useRouter();
  const { formatCurrency } = useLocalization();
  const { timezone } = useTimezone();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const list = filterTransactions(transactions, categoryFilter, timeFilter, timezone);
    return [...list].sort((a, b) => getExpenseTimestamp(b) - getExpenseTimestamp(a));
  }, [transactions, categoryFilter, timeFilter, timezone]);

  const visibleItems = expanded ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const overflowCount = filtered.length - INITIAL_LIMIT;

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)' // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)'; // Soft green border

  const brandColor = isPremium ? '#B8860B' : BRAND_GREEN;

  const handleTimeFilterSelect = (tabId: TimeFilter) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimeFilter(tabId);
    setExpanded(false); // Reset expansion on filter change
  };

  const handleToggleExpand = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpanded((prev) => !prev);
  };

  const emptyTitle = useMemo(() => {
    if (timeFilter === 'today') return 'No expenses today';
    if (timeFilter === 'week') return 'No expenses this week';
    return 'No expenses this month';
  }, [timeFilter]);

  const emptyDescription = useMemo(() => {
    const timeLabel = timeFilter === 'today' ? 'today' : timeFilter === 'week' ? 'this week' : 'this month';
    if (categoryFilter === 'all') {
      return `No expenses recorded ${timeLabel}. Tap below to log one.`;
    }
    return `No ${categoryFilter} expenses recorded ${timeLabel}. Tap below to log one.`;
  }, [categoryFilter, timeFilter]);

  return (
    <View style={styles.section}>
      {/* Section Header with Title, Count and Time Filter Slabs */}
      <View style={styles.headerContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.labelRow}>
            <AppText variant="body" weight="800" color={HomeTheme.text} style={styles.sectionTitle}>
              Recent Transactions
            </AppText>
            {filtered.length > 0 && (
              <View style={[styles.countBadge, isPremium && styles.countBadgePremium]}>
                <AppText variant="caption" weight="700" color={brandColor} style={styles.countText}>
                  {filtered.length}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Time Slab Pills (Today / This Week / This Month) */}
        <View style={styles.timePillsRow}>
          {TIME_FILTERS.map((tab) => {
            const active = timeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTimeFilterSelect(tab.id)}
                style={[
                  styles.timePill,
                  active && (isPremium ? styles.timePillActivePremium : styles.timePillActive),
                ]}
                activeOpacity={0.8}
              >
                <AppText
                  variant="caption"
                  weight={active ? '800' : '600'}
                  color={active ? '#FFFFFF' : HomeTheme.textMuted}
                  numberOfLines={1}
                  style={[
                    styles.timePillText,
                    active && { color: '#FFFFFF' },
                  ]}
                >
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <SkeletonList count={3} cardStyle={homePillCard.card} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={emptyTitle}
          description={emptyDescription}
          buttonLabel="Log First Expense"
          onButtonPress={onAddExpensePress || (() => router.push('/expense/add' as Href))}
        />
      ) : (
        <>
          {visibleItems.map((item, index) => (
            <AnimatedStackItem
              key={item.id}
              index={index}
              direction="up"
              staggerMs={55}
              distance={24}
            >
              <View style={[styles.transactionRow, { borderWidth: 1, borderColor: cardBorderColor }]}>
                {/* Category Icon Badge */}
                <ColorIconBadge
                  color={item.color}
                  backgroundColor={item.bg}
                  materialIcon={item.materialIcon}
                  size={38}
                  iconSize={18}
                  shape="circle"
                />

                {/* Info */}
                <View style={styles.textBlock}>
                  <AppText variant="bodySmall" weight="800" color={HomeTheme.text} style={styles.title}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" color={HomeTheme.textMuted} style={styles.subtitle}>
                    {item.subtitle}
                  </AppText>
                </View>

                {/* Amount */}
                <AppText variant="bodySmall" weight="800" color="#C62828" style={styles.amount}>
                  -{formatCurrency(item.amountVal)}
                </AppText>
              </View>
            </AnimatedStackItem>
          ))}

          {/* See More / Show Less Button */}
          {filtered.length > INITIAL_LIMIT && (
            <TouchableOpacity
              onPress={handleToggleExpand}
              style={[
                styles.moreBtn,
                isPremium && styles.moreBtnPremium,
              ]}
              activeOpacity={0.75}
            >
              <View style={styles.moreBtnContent}>
                <AppText
                  variant="caption"
                  weight="700"
                  color={brandColor}
                >
                  {expanded
                    ? 'Show Less'
                    : `+${overflowCount} more transaction${overflowCount !== 1 ? 's' : ''} · See More`}
                </AppText>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={brandColor}
                />
              </View>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  headerContainer: {
    marginBottom: Spacing.sm,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
  },
  countBadge: {
    backgroundColor: 'rgba(46,125,50,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.15)',
  },
  countBadgePremium: {
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    borderColor: 'rgba(212, 160, 23, 0.2)',
  },
  countText: {
    fontSize: 11,
  },
  timePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timePill: {
    paddingHorizontal: 13,
    paddingVertical: 5.5,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timePillActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  timePillActivePremium: {
    backgroundColor: '#0A2617',
    borderColor: '#D4A017',
  },
  timePillText: {
    fontSize: 11.5,
    lineHeight: 15,
    textAlign: 'center',
    includeFontPadding: false,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8.5,
    marginBottom: 6,
    marginHorizontal: 2,
    gap: 10,
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    lineHeight: 17,
  },
  subtitle: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  amount: {
    fontSize: 14,
    textAlign: 'right',
  },
  moreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    marginTop: 2,
    marginHorizontal: 2,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.12)',
  },
  moreBtnPremium: {
    backgroundColor: 'rgba(212, 160, 23, 0.06)',
    borderColor: 'rgba(212, 160, 23, 0.2)',
  },
  moreBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
