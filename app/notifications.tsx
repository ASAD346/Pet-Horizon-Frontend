import React, { useCallback } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useNotifications } from '@/hooks/useNotifications';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { SkeletonNotificationList } from '@/components/ui/skeletons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTaskDisplayName } from '@/src/utils/taskMappings';

function cleanNotificationText(str: string): string {
  if (!str) return '';
  return str
    .replace(/Feed Feeding/gi, 'Feeding')
    .replace(/Walk Walking/gi, 'Walking')
    .replace(/Walk Walk/gi, 'Walk')
    .replace(/feed feeding/gi, 'feeding')
    .replace(/walk walking/gi, 'walking')
    .replace(/walk walk/gi, 'walk');
}

function getNotificationCategory(item: any): string {
  const t = (item.title || '').toLowerCase();
  const b = (item.body || '').toLowerCase();
  const type = (item.type || '').toLowerCase();

  if (
    type === 'feeding' || type === 'food' ||
    t.includes('feed') || b.includes('feed') ||
    t.includes('food') || b.includes('food') ||
    t.includes('meal') || b.includes('meal')
  ) {
    return 'feeding';
  }
  if (
    type === 'walk' || type === 'walks' ||
    t.includes('walk') || b.includes('walk')
  ) {
    return 'walk';
  }
  if (
    type === 'medicine' || type === 'med' ||
    t.includes('med') || b.includes('med') ||
    t.includes('pill') || b.includes('pill') ||
    t.includes('dose') || b.includes('dose') ||
    t.includes('tablet') || b.includes('tablet') ||
    t.includes('capsule') || b.includes('capsule') ||
    t.includes('give') || b.includes('give')
  ) {
    return 'medicine';
  }
  if (
    type === 'grooming' || type === 'groom' ||
    t.includes('groom') || b.includes('groom') ||
    t.includes('trim') || b.includes('trim') ||
    t.includes('bath') || b.includes('bath') ||
    t.includes('wash') || b.includes('wash') ||
    t.includes('brush') || b.includes('brush') ||
    t.includes('haircut') || b.includes('haircut') ||
    t.includes('nail') || b.includes('nail')
  ) {
    return 'grooming';
  }
  if (
    type === 'vaccination' || type === 'vaccine' || type === 'vaccin' ||
    t.includes('vaccin') || b.includes('vaccin') ||
    t.includes('dhpp') || b.includes('dhpp') ||
    t.includes('needle') || b.includes('needle') ||
    t.includes('shot') || b.includes('shot') ||
    t.includes('booster') || b.includes('booster') ||
    t.includes('injection') || b.includes('injection') ||
    t.includes('rabies') || b.includes('rabies')
  ) {
    return 'vaccination';
  }
  return 'general';
}

const CATEGORY_STYLES: Record<string, { icon: string; color: string; bg: string; unreadBg: string }> = {
  feeding: { icon: 'restaurant-outline', color: '#D97706', bg: '#FEF3C7', unreadBg: '#FFFDF5' },
  walk: { icon: 'walk-outline', color: '#2563EB', bg: '#DBEAFE', unreadBg: '#F0F7FF' },
  medicine: { icon: 'medical-outline', color: '#9333EA', bg: '#F3E8FF', unreadBg: '#FAF5FF' },
  grooming: { icon: 'cut-outline', color: '#0D9488', bg: '#CCFBF1', unreadBg: '#F2FDFB' },
  vaccination: { icon: 'shield-checkmark-outline', color: '#DB2777', bg: '#FCE7F3', unreadBg: '#FFF5F9' },
  general: { icon: 'notifications-outline', color: '#4B5563', bg: '#F3F4F6', unreadBg: '#FAFAFA' },
};

function formatNotificationDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const isPast = diffMs >= 0;
  const absDiffMs = Math.abs(diffMs);
  
  const diffMins = Math.floor(absDiffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (isPast) {
    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
  } else {
    if (diffMins < 1) {
      return 'Starting now';
    }
    if (diffMins < 60) {
      return `in ${diffMins}m`;
    }
    if (diffHours < 24) {
      return `in ${diffHours}h`;
    }
  }
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }
  
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
}

interface GroupedNotifications {
  title: string;
  data: any[];
}

function groupNotifications(items: any[]): GroupedNotifications[] {
  const today: any[] = [];
  const yesterday: any[] = [];
  const earlier: any[] = [];
  
  const now = new Date();
  const todayStr = now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const yesterdayStr = yest.toDateString();
  
  items.forEach((item) => {
    if (!item.createdAt) {
      earlier.push(item);
      return;
    }
    const itemDate = new Date(item.createdAt);
    const itemDateStr = itemDate.toDateString();
    
    if (itemDateStr === todayStr) {
      today.push(item);
    } else if (itemDateStr === yesterdayStr) {
      yesterday.push(item);
    } else {
      earlier.push(item);
    }
  });
  
  const groups: GroupedNotifications[] = [];
  if (today.length > 0) {
    groups.push({ title: 'Today', data: today });
  }
  if (yesterday.length > 0) {
    groups.push({ title: 'Yesterday', data: yesterday });
  }
  if (earlier.length > 0) {
    groups.push({ title: 'Earlier', data: earlier });
  }
  return groups;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { items, loading, error, reload, markRead, markAllRead, remove } = useNotifications(token);
  const [refreshing, setRefreshing] = React.useState(false);
  const { showErrorToast } = useToast();

  React.useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error, showErrorToast]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload(true, true); // reload(force, silent)
    setRefreshing(false);
  }, [reload]);

  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';

  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const shadowColor = isPremium ? '#082113' : '#1B5E20';

  const screenBg = isPremium ? '#FFFDF0' : '#F5F6F8';
  const emptyCircleBg = isPremium ? 'rgba(212, 160, 23, 0.1)' : '#F3F4F6';
  const iconColor = isPremium ? '#D4A017' : '#9CA3AF';

  const unreadCount = items.filter(item => !item.isRead).length;
  const groupedData = React.useMemo(() => groupNotifications(items), [items]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={[]}>
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
                <Ionicons name="chevron-back" size={16} color={isPremium ? '#184F2E' : '#3A8F3B'} />
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.headerTitle}>
                  Notifications
                </AppText>
                {unreadCount > 0 && (
                  <AppText variant="caption" weight="600" color="rgba(255, 255, 255, 0.8)">
                    {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                  </AppText>
                )}
              </View>
              
              <TouchableOpacity onPress={markAllRead} hitSlop={12} style={styles.markAllReadBtn}>
                <AppText variant="bodySmall" weight="800" color="#FFFFFF">
                  Mark all read
                </AppText>
              </TouchableOpacity>
            </View>
            
            {/* Bottom accent line */}
            <View style={[
              styles.headerDivider,
              isPremium ? { backgroundColor: 'rgba(212, 160, 23, 0.3)' } : { backgroundColor: 'rgba(255,255,255,0.15)' }
            ]} />
          </LinearGradient>
        </View>
      </View>

      {loading && items.length === 0 ? (
        <SkeletonNotificationList />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={HomeTheme.cardGreen} />
          }
        >
          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyCircle, { backgroundColor: emptyCircleBg }]}>
                <Ionicons name="notifications-off-outline" size={32} color={iconColor} />
              </View>
              <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.emptyTitle}>
                No Notifications Yet
              </AppText>
              <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.emptyDesc}>
                We'll notify you here about upcoming schedules, activity updates, and reminders.
              </AppText>
            </View>
          ) : (
            groupedData.map((group) => (
              <View key={group.title} style={styles.sectionContainer}>
                <AppText variant="caption" weight="800" color={HomeTheme.textMuted} style={styles.sectionHeader}>
                  {group.title.toUpperCase()}
                </AppText>
                
                <View style={styles.groupContainer}>
                  {group.data.map((item, index) => {
                    const category = getNotificationCategory(item);
                    const config = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
                    const isUnread = !item.isRead;
                    const isLast = index === group.data.length - 1;

                    let petName = '';
                    let displayTitle = cleanNotificationText(item.title);
                    let displayBody = cleanNotificationText(item.body || '');

                    if (displayTitle === '🐾 Pet Horizon · Care Alert' && displayBody.includes('\n')) {
                      const lines = displayBody.split('\n');
                      displayTitle = lines[0].trim();
                      displayBody = lines.slice(1).join('\n').trim();

                      // Try to extract pet name from the header line e.g. "🥣 Bunty's Evening Meal Time"
                      const match = displayTitle.match(/^[^\w\s]*\s*(\w+)'s\s/);
                      if (match) {
                        petName = match[1];
                      }
                    } else if (item.title.includes('—')) {
                      const parts = item.title.split('—');
                      petName = parts[0].trim();
                      displayTitle = parts[1].trim();
                    } else if (item.title.includes('-')) {
                      const parts = item.title.split('-');
                      petName = parts[0].trim();
                      displayTitle = parts[1].trim();
                    }

                    if (!petName && displayBody.includes(':')) {
                      const parts = displayBody.split(':');
                      if (parts[0].trim().length < 15) {
                        petName = parts[0].trim();
                        displayBody = parts.slice(1).join(':').trim();
                      }
                    }

                    displayTitle = getTaskDisplayName(displayTitle);
                    if (displayBody.toLowerCase().startsWith('time for:')) {
                      const suffix = displayBody.slice(9).trim();
                      displayBody = `Time for: ${getTaskDisplayName(suffix)}`;
                    } else {
                      displayBody = getTaskDisplayName(displayBody);
                    }

                    // Map generic 'Reminder' titles to category-specific titles
                    if (displayTitle.toLowerCase() === 'reminder') {
                      if (category === 'feeding') displayTitle = 'Feeding Time';
                      else if (category === 'walk') displayTitle = 'Walk Reminder';
                      else if (category === 'medicine') displayTitle = 'Medication Due';
                      else if (category === 'grooming') displayTitle = 'Grooming Appointment';
                      else if (category === 'vaccination') displayTitle = 'Vaccination Alert';
                      else displayTitle = 'Alert';
                    }
                    
                    return (
                      <View key={item._id}>
                        <TouchableOpacity
                          style={[
                            styles.row,
                            isUnread && styles.unreadRow,
                          ]}
                          onPress={() => markRead(item._id)}
                          onLongPress={() => remove(item._id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.iconContainer}>
                            <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
                              <Ionicons name={config.icon as any} size={18} color={config.color} />
                            </View>
                            {isUnread && (
                              <View style={[styles.absoluteUnreadDot, { backgroundColor: config.color }]} />
                            )}
                          </View>
                          
                          <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                              <View style={styles.titleRow}>
                                {petName ? (
                                  <View style={[styles.petBadge, { backgroundColor: config.bg }]}>
                                    <AppText variant="caption" weight="800" color={config.color} style={styles.petBadgeText}>
                                      {petName}
                                    </AppText>
                                  </View>
                                ) : null}
                                <AppText variant="bodySmall" weight="800" color={HomeTheme.text} style={styles.cardTitle} numberOfLines={1}>
                                  {displayTitle}
                                </AppText>
                              </View>
                              {item.createdAt ? (
                                <AppText variant="caption" color={HomeTheme.textMuted} style={styles.timeText}>
                                  {formatNotificationDate(item.createdAt)}
                                </AppText>
                              ) : null}
                            </View>
                            
                            {displayBody ? (
                              <AppText variant="caption" color={HomeTheme.textMuted} style={styles.body}>
                                {displayBody}
                              </AppText>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                        {!isLast && <View style={styles.divider} />}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HomeTheme.background,
  },
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
    backgroundColor: '#F1F7F1',
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
    height: 56,
    paddingBottom: 8,
    position: 'relative',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    ...Platform.select({
      ios: { shadowColor: '#0E3821', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  markAllReadBtn: {
    height: 40,
    justifyContent: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  banner: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl * 1.5,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontSize: 16,
  },
  emptyDesc: {
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 240,
  },
  sectionContainer: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginLeft: 8,
    marginBottom: 6,
    marginTop: 4,
  },
  groupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EFE8',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0E380E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  unreadRow: {
    backgroundColor: '#F7FCF8',
  },
  iconContainer: {
    position: 'relative',
  },
  absoluteUnreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  petBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petBadgeText: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F6F3',
    marginLeft: 60, // Aligns divider perfectly after the icon circle
  },
});
