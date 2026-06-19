import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

interface PetProfileCardProps {
  name?: string;
  breed?: string;
  age?: string;
  gender?: string;
  weight?: string;
  activity?: string;
  health?: string;
  mood?: string;
  imageSource?: number;
  imageUrl?: string;
  loading?: boolean;
  isBirthdayToday?: boolean;
  onPress?: () => void;
}

function AvatarPlaceholder() {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View style={[styles.avatar, styles.avatarPlaceholder, animatedStyle]}>
      <Ionicons name="paw" size={28} color="rgba(255,255,255,0.85)" />
    </Animated.View>
  );
}

export function PetProfileCard({
  name = 'Your pet',
  breed = '—',
  age = '—',
  gender = '—',
  weight = '—',
  activity = '—',
  health = '—',
  mood = '—',
  imageSource = require('../../assets/images/onboarding.png'),
  imageUrl,
  loading = false,
  isBirthdayToday = false,
  onPress,
}: PetProfileCardProps) {
  const avatarSource = imageUrl ? { uri: imageUrl } : imageSource;
  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.92 } : {};

  return (
    <CardWrapper style={styles.card} {...cardProps}>
      <View style={styles.top}>
        {loading ? (
          <AvatarPlaceholder />
        ) : (
          <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
        )}
        <View style={styles.info}>
          <AppText variant="h3" weight="800" color={HomeTheme.white} style={styles.name}>
            {loading ? 'Loading…' : name}
          </AppText>
          <AppText variant="bodySmall" color={HomeTheme.white} style={styles.meta}>
            {loading ? '—' : isBirthdayToday ? `🎂 Birthday today · ${breed}` : `${breed} · ${age}`}
          </AppText>
          <View style={styles.tags}>
            <View style={styles.tag}>
              <AppText variant="caption" weight="600" color={HomeTheme.white}>
                {gender}
              </AppText>
            </View>
            <View style={styles.tag}>
              <AppText variant="caption" weight="600" color={HomeTheme.white}>
                {weight}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <StatColumn label="Plan" value={activity} />
        <StatColumn label="Weight" value={health} />
        <StatColumn label="Status" value={mood} />
      </View>
    </CardWrapper>
  );
}

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <AppText variant="caption" weight="700" color={HomeTheme.white} style={styles.statLabel}>
        {label}
      </AppText>
      <AppText variant="bodySmall" color={HomeTheme.white} weight="500">
        {value}
      </AppText>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: HomeTheme.cardGreenDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  android: { elevation: 6 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: HomeTheme.cardGreen,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    position: 'relative',
    ...cardShadow,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
  },
  meta: {
    opacity: 0.95,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: HomeTheme.tagOnGreen,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  divider: {
    height: 1,
    backgroundColor: HomeTheme.dividerOnGreen,
    marginVertical: Spacing.md,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    marginBottom: 4,
    opacity: 0.9,
  },
});
