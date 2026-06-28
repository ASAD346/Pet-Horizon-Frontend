import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/AppButton';
import { Radius, Spacing } from '@/constants/theme';
import { ScheduleTheme } from './scheduleTheme';

interface ScheduleFooterProps {
  loading?: boolean;
  disabled?: boolean;
  onSave: () => void;
  onSkip?: () => void;
}

const buttonShadow = Platform.select({
  ios: {
    shadowColor: ScheduleTheme.ctaOrangeShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  android: { elevation: 6 },
});

export function ScheduleFooter({ loading, disabled, onSave, onSkip }: ScheduleFooterProps) {
  return (
    <View style={styles.wrap}>
      <CustomButton
        title="Finish Setup"
        onPress={onSave}
        isLoading={loading}
        disabled={disabled || loading}
        icon={
          <MaterialCommunityIcons name="paw" size={20} color="#FFFFFF" />
        }
      />
      {onSkip ? (
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <AppText variant="bodySmall" weight="600" color={ScheduleTheme.textMuted}>
            Skip for now
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  skipBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
