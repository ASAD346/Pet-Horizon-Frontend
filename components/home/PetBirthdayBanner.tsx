import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { getBirthdayTurningAge } from '@/lib/pet/birthdayUtils';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

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
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="gift" size={22} color="#F59E0B" />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="body" weight="800" color={HomeTheme.text}>
          Happy Birthday, {petName}! 🎉
        </AppText>
        <AppText variant="bodySmall" color={HomeTheme.textMuted}>
          It&apos;s {ageLabel}. Give them extra love today.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFF8E7',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
});
