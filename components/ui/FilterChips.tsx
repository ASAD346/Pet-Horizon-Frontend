import React, { useRef } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { AppText } from './AppText';
import { Spacing, Radius } from '@/constants/theme';

export interface FilterChip<T extends string = string> {
  label: string;
  value: T;
}

interface FilterChipsProps<T extends string = string> {
  chips: FilterChip<T>[];
  selected: T;
  onChange: (value: T) => void;
  accentColor?: string;
  accentBg?: string;
}

export function FilterChips<T extends string = string>({
  chips,
  selected,
  onChange,
  accentColor = '#2E7D32',
  accentBg = '#E8F5E9',
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const isActive = chip.value === selected;
        return (
          <TouchableOpacity
            key={chip.value}
            onPress={() => onChange(chip.value)}
            style={[
              styles.chip,
              isActive
                ? { backgroundColor: accentBg, borderColor: accentColor }
                : styles.chipInactive,
            ]}
            activeOpacity={0.75}
          >
            <AppText
              variant="caption"
              weight={isActive ? '700' : '500'}
              color={isActive ? accentColor : '#616161'}
              style={styles.label}
            >
              {chip.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
