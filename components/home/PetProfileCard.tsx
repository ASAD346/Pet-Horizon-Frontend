import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
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
  onAddPet?: () => void;
  onPress?: () => void;
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
  onAddPet,
  onPress,
}: PetProfileCardProps) {
  const avatarSource = imageUrl ? { uri: imageUrl } : imageSource;
  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.92 } : {};

  return (
    <CardWrapper style={styles.card} {...cardProps}>
      {onAddPet ? (
        <TouchableOpacity
          style={styles.addPetBtn}
          onPress={onAddPet}
          activeOpacity={0.85}
          accessibilityLabel="Add pet"
        >
          <Ionicons name="add" size={22} color={HomeTheme.white} />
        </TouchableOpacity>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={HomeTheme.white} />
        </View>
      ) : null}

      <View style={styles.top}>
        <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
        <View style={styles.info}>
          <AppText variant="h3" weight="800" color={HomeTheme.white} style={styles.name}>
            {name}
          </AppText>
          <AppText variant="bodySmall" color={HomeTheme.white} style={styles.meta}>
            {breed} · {age}
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
  addPetBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: HomeTheme.tagOnGreen,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 2,
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
