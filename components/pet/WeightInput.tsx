import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { AppText } from '../ui/AppText';
import { Palette, Radius, Spacing } from '../../constants/theme';

export type WeightUnit = 'kg' | 'lbs';

interface WeightInputProps {
  value: string;
  unit: WeightUnit;
  onValueChange: (text: string) => void;
  onUnitChange: (unit: WeightUnit) => void;
}

export function WeightInput({ value, unit, onValueChange, onUnitChange }: WeightInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
        Weight
      </AppText>
      <View style={styles.row}>
        <View
          style={[
            styles.valueInputContainer,
            isFocused && styles.containerFocused,
          ]}
        >
          <TextInput
            value={value}
            onChangeText={onValueChange}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Palette.gray[400]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={styles.valueInput}
          />
        </View>
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
            onPress={() => onUnitChange('kg')}
            activeOpacity={0.85}
          >
            <AppText
              variant="bodySmall"
              weight="700"
              color={unit === 'kg' ? Palette.white : Palette.gray[500]}
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
              color={unit === 'lbs' ? Palette.white : Palette.gray[500]}
            >
              LBS
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  valueInputContainer: {
    flex: 1,
    height: 52,
    backgroundColor: '#FCFCFD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  containerFocused: {
    borderColor: '#5CB35D',
    backgroundColor: Palette.white,
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  valueInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.gray[800],
    fontWeight: '600',
    paddingVertical: 0,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#FCFCFD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    padding: 3,
    height: 52,
    alignItems: 'center',
    width: 120,
    justifyContent: 'space-between',
  },
  unitBtn: {
    flex: 1,
    height: '100%',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnActive: {
    backgroundColor: '#5CB35D',
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});
