import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
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
}

export function PetProfileCard({
  name = 'Boby',
  breed = 'Maine Coon',
  age = '2 Years',
  gender = 'Male',
  weight = '10 KG',
  activity = '85%',
  health = 'Good',
  mood = 'Happy',
  imageSource = require('../../assets/images/onboarding.png'),
}: PetProfileCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Image source={imageSource} style={styles.avatar} contentFit="cover" />
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
        <StatColumn label="Activity" value={activity} />
        <StatColumn label="Health" value={health} />
        <StatColumn label="Mood" value={mood} />
      </View>
    </View>
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
