import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { HeaderActionButtons } from '../ui/HeaderActionButtons';
import { Spacing } from '../../constants/theme';
import { Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { resolveMediaUrl } from '@/lib/mediaUrl';

interface HomeHeaderProps {
  userName?: string;
  dateLabel?: string;
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  showJournal?: boolean;
  /** Status bar height — header extends behind the status bar */
  topInset?: number;
  isPremium?: boolean;
}


function getGreeting(userName: string): string {
  const hours = new Date().getHours();
  const name = userName.trim();
  if (hours >= 5 && hours < 12) return `Good morning, ${name} 👋`;
  if (hours >= 12 && hours < 17) return `Good afternoon, ${name} 👋`;
  if (hours >= 17 && hours < 22) return `Good evening, ${name} 👋`;
  return `Good night, ${name} 🌙`;
}

export function HomeHeader({
  userName = 'there',
  dateLabel = 'Today',
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  showJournal = true,
  topInset = 0,
  isPremium = false,
}: HomeHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const rawImage = user?.profileImage;
  const userImage = rawImage ? resolveMediaUrl(rawImage) : null;

  const greeting = getGreeting(userName);
  const insets = useSafeAreaInsets();

  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const shadowColor = isPremium ? '#082113' : '#1B5E20';
  const safeLeft = Math.max(insets.left, Spacing.lg);
  const safeRight = Math.max(insets.right, Spacing.lg);

  // Extract initial for avatar badge
  const userInitial = userName.trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.wrapper, { shadowColor }]}>
      <View style={styles.curveClipper}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              paddingTop: topInset + 14,
              paddingLeft: safeLeft,
              paddingRight: safeRight,
            },
          ]}
        >
          {/* Decorative background rings */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.bgRing1} />
            <View style={styles.bgRing2} />
          </View>

          <View style={styles.row}>
            <View style={styles.leftContainer}>
              {/* User Avatar Action */}
              <Pressable
                onPress={() => router.push('/profile')}
                style={[styles.avatarOuterRing, isPremium ? { borderColor: '#D4A017' } : { borderColor: 'rgba(255,255,255,0.45)' }]}
              >
                <View style={[styles.avatarInnerContainer, isPremium ? { backgroundColor: 'rgba(212, 160, 23, 0.18)' } : { backgroundColor: 'rgba(255,255,255,0.22)' }, userImage ? { backgroundColor: 'transparent' } : {}]}>
                  {userImage ? (
                    <Image source={{ uri: userImage }} style={styles.avatarImage} />
                  ) : (
                    <AppText weight="800" style={[styles.avatarText, isPremium ? { color: '#FFF176' } : { color: '#FFFFFF' }]}>
                      {userInitial}
                    </AppText>
                  )}
                </View>
              </Pressable>

              {/* Left: greeting + date chip */}
              <View style={styles.textBlock}>
                <AppText
                  variant="bodySmall"
                  weight="800"
                  color="#FFFFFF"
                  style={styles.greetingText}
                  numberOfLines={1}
                >
                  {greeting}
                </AppText>
                <View style={[styles.dateChip, isPremium ? { borderColor: 'rgba(212, 160, 23, 0.35)', backgroundColor: 'rgba(255, 255, 255, 0.08)' } : { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <MaterialCommunityIcons name="calendar-today" size={10} color={isPremium ? '#FFF176' : '#FFFFFF'} />
                  <AppText
                    variant="caption"
                    weight="800"
                    color="#FFFFFF"
                    style={styles.dateText}
                    numberOfLines={1}
                  >
                    {'  '}{dateLabel}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Right: action buttons */}
            <HeaderActionButtons
              notificationCount={notificationCount}
              onJournalPress={onJournalPress}
              onNotificationsPress={onNotificationsPress}
              showJournal={showJournal}
              dark
            />
          </View>

          {/* Ultra-thin bottom accent line */}
          <View style={[styles.divider, isPremium ? { backgroundColor: 'rgba(212, 160, 23, 0.3)' } : { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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
  gradient: {
    paddingBottom: 0,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 16,
    lineHeight: 20,
  },
  textBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
    gap: 1,
  },
  greetingText: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  dateText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
  },
});
