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
    await reload();
    setRefreshing(false);
  }, [reload]);

  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';

  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const shadowColor = isPremium ? '#082113' : '#1B5E20';

  return (
    <SafeAreaView style={styles.container} edges={[]}>
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
                <Ionicons name="chevron-back" size={24} color="#0E3821" />
              </TouchableOpacity>
              
              <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.headerTitle}>
                Notifications
              </AppText>
              
              <TouchableOpacity onPress={markAllRead} hitSlop={12} style={styles.markAllReadBtn}>
                <AppText variant="caption" weight="800" color="#FFFFFF">
                  Mark all
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
            <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.empty}>
              No notifications yet.
            </AppText>
          ) : (
            items.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[styles.card, !item.isRead && styles.unreadCard]}
                onPress={() => markRead(item._id)}
                onLongPress={() => remove(item._id)}
              >
                <View style={styles.cardHeader}>
                  <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                    {item.title}
                  </AppText>
                  {!item.isRead ? <View style={styles.dot} /> : null}
                </View>
                {item.body ? (
                  <AppText variant="caption" color={HomeTheme.textMuted} style={styles.body}>
                    {item.body}
                  </AppText>
                ) : null}
                {item.createdAt ? (
                  <AppText variant="caption" color={HomeTheme.textMuted}>
                    {new Date(item.createdAt).toLocaleString()}
                  </AppText>
                ) : null}
              </TouchableOpacity>
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
    height: 48,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    ...Platform.select({
      ios: { shadowColor: '#0E3821', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  markAllReadBtn: {
    minWidth: 60,
    alignItems: 'flex-end',
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  card: {
    backgroundColor: HomeTheme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: HomeTheme.surfaceMuted,
  },
  unreadCard: {
    borderColor: HomeTheme.cardGreen,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HomeTheme.badgeRed,
  },
  body: {
    marginBottom: 4,
  },
});
