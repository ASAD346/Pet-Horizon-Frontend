import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { getBirthdayTurningAge } from '@/lib/pet/birthdayUtils';
import { Radius, Spacing, Palette } from '@/constants/theme';

interface PetBirthdayBannerProps {
  petName: string;
  birthday?: string | null;
}

export function PetBirthdayBanner({ petName, birthday }: PetBirthdayBannerProps) {
  const turningAge = getBirthdayTurningAge(birthday);
  const ageLabel =
    turningAge === null
      ? 'today'
      : turningAge === 0
        ? 'their first birthday'
        : `turning ${turningAge} today`;

  return (
    <LinearGradient
      colors={['#FFFDF0', '#FFF9E6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="gift" size={20} color={Palette.premium.gold} />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="body" weight="800" color="#856404">
          Happy Birthday, {petName}! 🎉
        </AppText>
        <AppText variant="caption" weight="600" color="#9E802B">
          It&apos;s {ageLabel}. Give them extra love today.
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
});
