import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchUserProfile } from '@/services/users/userApi';
import { fetchPremiumStatus } from '@/services/premium/premiumApi';
import type { PremiumStatusResponse } from '@/types/premium';
import { PremiumUpgradeBanner } from './PremiumUpgradeBanner';
import { ProfileMenuRow, ProfileMenuSection } from './ProfileMenuRow';
import { ProfileUserCard } from './ProfileUserCard';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { ProfileTheme } from './profileTheme';

export function ProfileHubView() {
  const router = useRouter();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token, user, logout, setSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatusResponse | null>(null);

  const reload = useCallback(async () => {
    if (!token || !user?._id) {
      setPremiumStatus(null);
      return;
    }

    setLoading(true);
    try {
      const [profile, status] = await Promise.all([
        fetchUserProfile(token, user._id),
        fetchPremiumStatus(token),
      ]);
      await setSession({ token, user: profile });
      setPremiumStatus(status);
    } catch (error) {
      Alert.alert('Profile', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, user?._id, setSession]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handleLogout = useCallback(async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  }, [logout, router]);

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'User';
  const isPremium = premiumStatus?.isPremium ?? user?.premiumStatus === 'premium';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.pageHeader}>
        <AppText variant="h3" weight="800" color={ProfileTheme.text}>
          My Hub
        </AppText>
        {loading ? <ActivityIndicator size="small" color={ProfileTheme.green} /> : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={ProfileTheme.green} />
        }
      >
        <ProfileUserCard
          name={displayName}
          email={user?.email ?? ''}
          imageUrl={resolveMediaUrl(user?.profileImage)}
          onEditPress={() => router.push('/profile/edit' as Href)}
        />

        {isPremium ? (
          <View style={styles.premiumActiveWrap}>
            <AuthInfoBanner
              message={`Premium active${premiumStatus?.plan ? ` · ${premiumStatus.plan}` : ''}${
                premiumStatus?.expiresAt
                  ? ` · renews ${new Date(premiumStatus.expiresAt).toLocaleDateString()}`
                  : ''
              }`}
            />
          </View>
        ) : (
          <PremiumUpgradeBanner onUpgradePress={() => router.push('/profile/premium' as Href)} />
        )}

        <ProfileMenuSection title="ACCOUNT & SECURITY">
          <ProfileMenuRow
            icon="person-outline"
            title="Profile Information"
            subtitle="Name, email, and photo"
            onPress={() => router.push('/profile/edit' as Href)}
          />
          <ProfileMenuRow
            icon="lock-closed-outline"
            title="Password & Security"
            subtitle="Protect your account"
            onPress={() => router.push('/profile/change-password' as Href)}
          />
          <ProfileMenuRow
            icon="people-outline"
            title="Family Sharing"
            subtitle="Manage hub members"
            onPress={() => router.push('/(tabs)/community')}
          />
          {!isPremium ? (
            <ProfileMenuRow
              icon="diamond-outline"
              title="Premium Hub"
              subtitle="Plans and billing"
              onPress={() => router.push('/profile/premium' as Href)}
            />
          ) : (
            <ProfileMenuRow
              icon="card-outline"
              title="Billing & Subscription"
              subtitle="Invoices, payment method, cancel"
              onPress={() => router.push('/profile/billing' as Href)}
            />
          )}
        </ProfileMenuSection>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#C62828" />
          <AppText variant="body" weight="700" color="#C62828">
            Log out
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 12,
  },
  scroll: {},
  premiumActiveWrap: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 8,
    paddingVertical: 14,
  },
});
