import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ScheduleTheme } from './scheduleTheme';

interface ScheduleHeaderProps {
  petName?: string;
}

export function ScheduleHeader({ petName }: ScheduleHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <AppText variant="h2" weight="800" color={ScheduleTheme.text} style={styles.title}>
          Set Up Care{'\n'}Schedules
        </AppText>
        <AppText variant="bodySmall" color={ScheduleTheme.textMuted} style={styles.subtitle}>
          {petName
            ? `Create reminders and routines for ${petName}.`
            : 'Create reminders and routines for your pet.'}
        </AppText>
      </View>
      <View style={styles.artWrap}>
        <Image
          source={require('../../assets/images/onboarding.png')}
          style={styles.art}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  textCol: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: Spacing.sm,
    lineHeight: 20,
    maxWidth: 220,
  },
  artWrap: {
    width: 96,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    width: 96,
    height: 88,
    borderRadius: Radius.md,
  },
});
