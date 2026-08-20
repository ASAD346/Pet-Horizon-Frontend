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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
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
    .replace(/walk walk/gi, 'walk')
    .replace(/\s*\.?\s*Tap To Open App And Log Activity\.?/gi, '')
    .trim();
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
  const { items, loading, hasLoaded, error, reload, markRead, markAllRead, remove } = useNotifications(token);
  const [refreshing, setRefreshing] = React.useState(false);
  const { showErrorToast } = useToast();

  React.useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error, showErrorToast]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload(true); // reload(force)
    setRefreshing(false);
  }, [reload]);

  const renderRightActions = (id: string) => (progress: any, dragX: any) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => remove(id)}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        <AppText variant="caption" weight="800" color="#FFFFFF" style={{ marginTop: 2, fontSize: 10 }}>
          Delete
        </AppText>
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';

  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const shadowColor = isPremium ? '#082113' : '#1B5E20';

  const screenBg = HomeTheme.background;
  const emptyCircleBg = isPremium ? 'rgba(212, 160, 23, 0.1)' : '#F3F4F6';
  const iconColor = isPremium ? '#D4A017' : '#9CA3AF';

  const unreadCount = items.filter(item => !item.isRead).length;
  const groupedData = React.useMemo(() => groupNotifications(items), [items]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

      {loading && !hasLoaded && items.length === 0 ? (
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
                
                {group.data.map((item, index) => {
                  const category = getNotificationCategory(item);
                  const config = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
                  const isUnread = !item.isRead;

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

                  if (petName) {
                    const cleanRegex = new RegExp(`^${petName}'s\\s*|\\b${petName}'s\\b|\\b${petName}\\b`, 'gi');
                    displayTitle = displayTitle.replace(cleanRegex, '').trim();
                    displayBody = displayBody.replace(cleanRegex, '').trim();
                    
                    // Cleanup leading separator characters if any remain (e.g. "- Evening Meal" or "Evening Meal")
                    displayTitle = displayTitle.replace(/^[-—:\s]+/, '').trim();
                    displayBody = displayBody.replace(/^[-—:\s]+/, '').trim();
                    
                    // Cleanup trailing "to" or "to." if pet name was removed from the end of the sentence
                    displayBody = displayBody.replace(/\s+to\s*[\s\.]*$/gi, '').trim();
                    
                    if (displayTitle) {
                      displayTitle = displayTitle.charAt(0).toUpperCase() + displayTitle.slice(1);
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
                  if (displayTitle.toLowerCase() === 'reminder' || !displayTitle) {
                    if (category === 'feeding') displayTitle = 'Feeding Time';
                    else if (category === 'walk') displayTitle = 'Walk Reminder';
                    else if (category === 'medicine') displayTitle = 'Medication Due';
                    else if (category === 'grooming') displayTitle = 'Grooming Appointment';
                    else if (category === 'vaccination') displayTitle = 'Vaccination Alert';
                    else displayTitle = 'Alert';
                  }
                  
                  return (
                    <View key={item._id} style={{ marginBottom: 8 }}>
                      <Swipeable
                        renderRightActions={renderRightActions(item._id)}
                        friction={2}
                        rightThreshold={40}
                      >
                        <TouchableOpacity
                          style={[
                            styles.card,
                            isUnread && styles.unreadCard,
                          ]}
                          onPress={() => markRead(item._id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.iconContainer}>
                            <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
                              <Ionicons name={config.icon as any} size={18} color={config.color} />
                            </View>
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
                              {isUnread && (
                                <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
                              )}
                            </View>
                            
                            {displayBody ? (
                              <AppText variant="caption" color={HomeTheme.textMuted} style={styles.body}>
                                {displayBody}
                              </AppText>
                            ) : null}

                            {item.createdAt ? (
                              <AppText variant="caption" color="#94A3B8" style={styles.timeText}>
                                {formatNotificationDate(item.createdAt)}
                              </AppText>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      </Swipeable>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
    </GestureHandlerRootView>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAF0EA',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#0E380E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  unreadCard: {
    backgroundColor: '#F7FCF8',
    borderColor: '#D2ECD5',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  petBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
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
    fontSize: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  body: {
    fontSize: 11,
    lineHeight: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    borderRadius: 16,
    marginLeft: 8,
  },
});
