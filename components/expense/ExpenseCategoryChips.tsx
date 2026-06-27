import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { SheetColors } from '../sheets/sheetUi';

interface ExpenseCategoryChipsProps {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function ExpenseCategoryChips({
  categories,
  selected,
  onSelect,
}: ExpenseCategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: SheetColors.chipBg,
  },
  chipActive: {
    backgroundColor: '#2E7D32', // Matches Form BRAND_GREEN
  },
});
