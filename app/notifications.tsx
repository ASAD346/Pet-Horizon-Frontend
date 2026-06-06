import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { items, loading, error, reload, markRead, markAllRead, remove } = useNotifications(token);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={HomeTheme.text} />
        </TouchableOpacity>
        <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.title}>
          Notifications
        </AppText>
        <TouchableOpacity onPress={markAllRead} hitSlop={12}>
          <AppText variant="caption" weight="700" color={HomeTheme.cardGreen}>
            Mark all read
          </AppText>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.banner}>
          <AuthErrorBanner message={error} />
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
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
