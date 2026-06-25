import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';
import type { JournalCategory } from './journalData';

type Chip = { id: JournalCategory; label: string };

interface JournalCategoryChipsProps {
  chips: Chip[];
  selected: JournalCategory;
  onSelect: (id: JournalCategory) => void;
  themeColor?: string;
}

export function JournalCategoryChips({ chips, selected, onSelect, themeColor }: JournalCategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {chips.map((chip) => {
        const active = chip.id === selected;
        return (
          <TouchableOpacity
            key={chip.id}
            activeOpacity={0.85}
            onPress={() => onSelect(chip.id)}
            style={[
              styles.chip,
              active && { backgroundColor: themeColor || JournalTheme.navy }
            ]}
          >
            <AppText
              variant="bodySmall"
              weight="600"
              color={active ? JournalTheme.surface : JournalTheme.textMuted}
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
  scroll: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: JournalTheme.chipBg,
  },
  chipActive: {
    backgroundColor: JournalTheme.navy,
  },
});
