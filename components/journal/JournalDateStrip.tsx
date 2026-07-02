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
  themeColor?: string;
}

export function JournalDateStrip({ dates, selectedId, onSelect, themeColor }: JournalDateStripProps) {
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
            style={[
              styles.card,
              selected && { backgroundColor: themeColor || JournalTheme.navy, borderColor: themeColor || JournalTheme.navy }
            ]}
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
    gap: Spacing.sm - 2,
  },
  card: {
    width: 48,
    minHeight: 64,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  cardSelected: {
    backgroundColor: JournalTheme.navy,
    borderColor: JournalTheme.navy,
  },
  dateNum: {
    marginTop: 2,
    fontSize: 16,
  },
  trailingSpacer: {
    width: Spacing.sm,
  },
});
