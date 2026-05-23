import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../ui/AppText';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

export type WeightUnit = 'kg' | 'lbs';

interface WeightInputProps {
  value: string;
  unit: WeightUnit;
  onValueChange: (text: string) => void;
  onUnitChange: (unit: WeightUnit) => void;
}

export function WeightInput({ value, unit, onValueChange, onUnitChange }: WeightInputProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color={LoginTheme.charcoal} style={styles.label}>
        Weight
      </AppText>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onValueChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={LoginTheme.inputPlaceholder}
          style={styles.valueInput}
        />
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
            onPress={() => onUnitChange('kg')}
            activeOpacity={0.85}
          >
            <AppText
              variant="bodySmall"
              weight="700"
              color={unit === 'kg' ? LoginTheme.footerText : LoginTheme.charcoal}
            >
              KG
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitBtn, unit === 'lbs' && styles.unitBtnActive]}
            onPress={() => onUnitChange('lbs')}
            activeOpacity={0.85}
          >
            <AppText
              variant="bodySmall"
              weight="700"
              color={unit === 'lbs' ? LoginTheme.footerText : LoginTheme.charcoal}
            >
              LBS
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const fieldShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  android: { elevation: 1 },
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  valueInput: {
    flex: 1,
    height: 42,
    backgroundColor: LoginTheme.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: LoginTheme.charcoal,
    fontWeight: '500',
    ...fieldShadow,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: LoginTheme.inputBg,
    borderRadius: Radius.md,
    padding: 3,
    ...fieldShadow,
  },
  unitBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    minWidth: 48,
    alignItems: 'center',
  },
  unitBtnActive: {
    backgroundColor: LoginTheme.green,
  },
});
