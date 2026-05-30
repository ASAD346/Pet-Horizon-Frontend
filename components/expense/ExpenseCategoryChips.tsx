import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { SheetColors } from '../sheets/sheetUi';
import type { ExpenseCategory } from './expenseData';

interface ExpenseCategoryChipsProps {
  categories: readonly ExpenseCategory[];
  selected: ExpenseCategory;
  onSelect: (category: ExpenseCategory) => void;
}

export function ExpenseCategoryChips({
  categories,
  selected,
  onSelect,
}: ExpenseCategoryChipsProps) {
  return (
    <View style={styles.wrap}>
      {categories.map((category) => {
        const active = category === selected;
        return (
          <TouchableOpacity
            key={category}
            activeOpacity={0.85}
            onPress={() => onSelect(category)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <AppText
              variant="bodySmall"
              weight="600"
              color={active ? HomeTheme.white : SheetColors.chipText}
            >
              {category}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: SheetColors.chipBg,
  },
  chipActive: {
    backgroundColor: HomeTheme.green,
  },
});
