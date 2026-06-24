import React, { useCallback, useState, useRef } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/hooks/useAuth';
import { Radius, Spacing } from '@/constants/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchUserProfile } from '@/services/users/userApi';
import { fetchPremiumStatus } from '@/services/premium/premiumApi';
import type { PremiumStatusResponse } from '@/types/premium';
import { PremiumUpgradeBanner } from './PremiumUpgradeBanner';
import { PremiumActiveCard } from './PremiumActiveCard';
import { ProfileMenuRow, ProfileMenuSection } from './ProfileMenuRow';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { useTabHeaderActions } from '@/hooks/useTabHeaderActions';
import { HeaderActionButtons } from '@/components/ui/HeaderActionButtons';
import { ProfileTheme } from './profileTheme';
import { useFocusReload, useStaleLoadScope } from '@/hooks/useStaleLoadScope';
import { TermsAndConditionsSheet } from './TermsAndConditionsSheet';
import { PrivacyPolicySheet } from './PrivacyPolicySheet';
import { HelpSupportSheet } from './HelpSupportSheet';

export function ProfileHubView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Custom Header Heights
  const MIN_HEADER_HEIGHT = 64 + insets.top;
  const MAX_HEADER_HEIGHT = 220 + insets.top;
  const SCROLL_DISTANCE = MAX_HEADER_HEIGHT - MIN_HEADER_HEIGHT;

  const { clearance: tabBarClearance } = useTabBarLayout();
  const { notificationCount, onNotificationsPress } = useTabHeaderActions();
  const { token, user, logout, setSession } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatusResponse | null>(null);
  
  const [termsVisible, setTermsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const { shouldBlockUI, markLoaded, reset } = useStaleLoadScope(user?._id ?? null);

  const scrollY = useRef(new Animated.Value(0)).current;

  const reload = useCallback(async () => {
    if (!token || !user?._id) {
      reset();
      setPremiumStatus(null);
      return;
    }

    const block = shouldBlockUI();
    if (block) setLoading(true);

    try {
      const [profile, status] = await Promise.all([
        fetchUserProfile(token, user._id),
        fetchPremiumStatus(token),
      ]);
      await setSession({ token, user: profile });
      setPremiumStatus(status);
      markLoaded();
    } catch (error) {
      if (block) {
        Alert.alert('Profile', getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, [token, user?._id, setSession, shouldBlockUI, markLoaded, reset]);

  useFocusReload(reload, Boolean(token && user?._id));

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

  // Gradient selection matching Home Header
  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const shadowColor = isPremium ? '#082113' : '#1B5E20';

  // Animation Mappings
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const largeDetailsOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const largeDetailsScale = scrollY.interpolate({
    inputRange: [-100, 0, SCROLL_DISTANCE * 0.5],
    outputRange: [1.1, 1, 0.9],
    extrapolate: 'clamp',
  });

  const miniProfileOpacity = scrollY.interpolate({
    inputRange: [SCROLL_DISTANCE * 0.6, SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Sticky Collapsible Animated Header Container */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            height: MAX_HEADER_HEIGHT,
            transform: [{ translateY: headerTranslateY }],
            shadowColor,
          },
        ]}
      >
        <View style={styles.curveClipper}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, { height: MAX_HEADER_HEIGHT, paddingTop: insets.top }]}
          >
            {/* Decorative concentric background rings */}
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.bgRing1} />
              <View style={styles.bgRing2} />
              <View style={styles.bgRing3} />
            </View>

            {/* Large Profile Content (Avatar, Name, Email) */}
            <Animated.View
              style={[
                styles.largeProfileContent,
                {
                  opacity: largeDetailsOpacity,
                  transform: [{ scale: largeDetailsScale }],
                },
              ]}
            >
              <View style={[styles.avatarOuterRing, isPremium && styles.avatarOuterRingPremium]}>
                {user?.profileImage ? (
                  <Image source={{ uri: resolveMediaUrl(user.profileImage) }} style={styles.largeAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.largeAvatar, styles.avatarFallbackLarge]}>
                    <Ionicons name="person" size={36} color="#FFF" />
                  </View>
                )}
              </View>
              
              <View style={styles.nameRow}>
                <AppText variant="h2" weight="800" color="#FFFFFF" style={styles.largeName}>
                  {displayName}
                </AppText>
                {isPremium && (
                  <View style={styles.premiumCrownBadge}>
                    <Ionicons name="star" size={10} color="#D4A017" />
                  </View>
                )}
              </View>

              <AppText variant="bodySmall" color="rgba(255,255,255,0.75)">
                {user?.email ?? ''}
              </AppText>

              <View style={[styles.tagBadge, isPremium && styles.tagBadgePremium]}>
                <AppText variant="caption" weight="800" color={isPremium ? '#FFF9E6' : '#FFFFFF'} style={styles.tagText}>
                  {isPremium ? 'PREMIUM PARENT' : 'PET PARENT'}
                </AppText>
              </View>
            </Animated.View>

            {/* Bottom Bar: remains pinned at the bottom when translated up */}
            <View style={styles.bottomBar}>
              {/* Expanded State title */}
              <Animated.View style={[styles.expandedTitleContainer, { opacity: largeTitleOpacity }]}>
                <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.pageTitle}>
                  My Profile
                </AppText>
              </Animated.View>

              {/* Collapsed State mini-profile */}
              <Animated.View
                style={[
                  styles.miniProfile,
                  {
                    opacity: miniProfileOpacity,
                    transform: [
                      {
                        translateY: scrollY.interpolate({
                          inputRange: [SCROLL_DISTANCE * 0.6, SCROLL_DISTANCE],
                          outputRange: [10, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              >
                {user?.profileImage ? (
                  <Image source={{ uri: resolveMediaUrl(user.profileImage) }} style={styles.miniAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.miniAvatar, styles.avatarFallbackMini]}>
                    <Ionicons name="person" size={14} color="#FFF" />
                  </View>
                )}
                <AppText variant="body" weight="800" color="#FFFFFF" numberOfLines={1} style={styles.miniName}>
                  {displayName}
                </AppText>
                {isPremium && (
                  <Ionicons name="star" size={10} color="#FFF176" style={styles.miniCrown} />
                )}
              </Animated.View>
            </View>

            {/* Bottom thin accent border line */}
            <View style={[styles.bottomDivider, isPremium && { backgroundColor: 'rgba(212, 160, 23, 0.3)' }]} />
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Static Top Right Actions Overlay */}
      <View style={[styles.staticActions, { top: insets.top }]}>
        <HeaderActionButtons
          notificationCount={notificationCount}
          onNotificationsPress={onNotificationsPress}
          showJournal={false}
          dark
        />
      </View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: MAX_HEADER_HEIGHT + 14,
            paddingBottom: tabBarClearance,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reload}
            tintColor={isPremium ? '#FFF176' : ProfileTheme.green}
            progressViewOffset={MAX_HEADER_HEIGHT}
          />
        }
      >
        {/* Subscription Section */}
        {isPremium ? (
          <PremiumActiveCard planName={premiumStatus?.plan ?? undefined} expiresAt={premiumStatus?.expiresAt ?? undefined} />
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

        <ProfileMenuSection title="LEGAL & SUPPORT">
          <ProfileMenuRow
            icon="document-text-outline"
            title="Terms & Conditions"
            subtitle="Read our usage agreement"
            onPress={() => setTermsVisible(true)}
          />
          <ProfileMenuRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={() => setPrivacyVisible(true)}
          />
          <ProfileMenuRow
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQs and contact info"
            onPress={() => setHelpVisible(true)}
          />
        </ProfileMenuSection>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#C62828" />
          <AppText variant="body" weight="700" color="#C62828">
            Log out
          </AppText>
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Legal & Support sheets */}
      <TermsAndConditionsSheet visible={termsVisible} onClose={() => setTermsVisible(false)} />
      <PrivacyPolicySheet visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
      <HelpSupportSheet visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  curveClipper: {
    flex: 1,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  headerGradient: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  largeProfileContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 10,
    zIndex: 2,
  },
  bgRing1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -60,
    right: -60,
  },
  bgRing2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: -40,
    left: -30,
  },
  bgRing3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: 40,
    left: 80,
  },
  avatarOuterRing: {
    padding: 3,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    marginBottom: Spacing.sm,
  },
  avatarOuterRingPremium: {
    borderColor: 'rgba(212, 160, 23, 0.65)',
  },
  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
  },
  avatarFallbackLarge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  largeName: {
    fontSize: 20,
    lineHeight: 26,
    color: '#FFFFFF',
  },
  premiumCrownBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagBadgePremium: {
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  tagText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  bottomBar: {
    height: 64,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    position: 'relative',
    zIndex: 3,
  },
  staticActions: {
    position: 'absolute',
    right: Spacing.lg,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
  },
  expandedTitleContainer: {
    position: 'absolute',
    left: Spacing.lg,
    bottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  miniProfile: {
    position: 'absolute',
    left: Spacing.lg,
    right: 80,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarFallbackMini: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  miniCrown: {
    marginLeft: -2,
  },
  bottomDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  scroll: {},
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
