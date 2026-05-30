import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';

export type JournalDateItem = {
  id: string;
  day: string;
  date: number;
};

interface JournalDateStripProps {
  dates: readonly JournalDateItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function JournalDateStrip({ dates, selectedId, onSelect }: JournalDateStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {dates.map((item) => {
        const selected = item.id === selectedId;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => onSelect(item.id)}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <AppText
              variant="caption"
              weight="600"
              color={selected ? JournalTheme.surface : JournalTheme.textLight}
            >
              {item.day}
            </AppText>
            <AppText
              variant="body"
              weight="800"
              color={selected ? JournalTheme.surface : JournalTheme.text}
              style={styles.dateNum}
            >
              {item.date}
            </AppText>
          </TouchableOpacity>
        );
      })}
      <View style={styles.trailingSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  card: {
    width: 56,
    minHeight: 72,
    borderRadius: Radius.md,
    backgroundColor: JournalTheme.surface,
    borderWidth: 1,
    borderColor: JournalTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  cardSelected: {
    backgroundColor: JournalTheme.navy,
    borderColor: JournalTheme.navy,
  },
  dateNum: {
    marginTop: 4,
    fontSize: 18,
  },
  trailingSpacer: {
    width: Spacing.sm,
  },
});
