import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';
import { getCategoryStyle } from './journalData';

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
  dateCategories?: Record<string, string[]>;
}

export function JournalDateStrip({
  dates,
  selectedId,
  onSelect,
  themeColor,
  dateCategories,
}: JournalDateStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {dates.map((item) => {
        const selected = item.id === selectedId;
        const activeCategories = dateCategories?.[item.id] ?? [];

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
            
            {/* Dots Row representing activity categories */}
            <View style={styles.dotsRow}>
              {activeCategories.slice(0, 4).map((cat) => {
                const catStyle = getCategoryStyle(cat as any);
                return (
                  <View
                    key={cat}
                    style={[
                      styles.dot,
                      { backgroundColor: selected ? '#FFFFFF' : catStyle.color },
                    ]}
                  />
                );
              })}
            </View>
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
    minHeight: 70,
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
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
    height: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  trailingSpacer: {
    width: Spacing.sm,
  },
});
