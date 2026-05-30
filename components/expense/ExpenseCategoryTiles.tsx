import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { homeCardShadow } from '../home/homeStyles';
import { EXPENSE_TRACKER_CATEGORIES, type ExpenseTrackerCategory } from './expenseTrackerData';

interface ExpenseCategoryTilesProps {
  selected: ExpenseTrackerCategory;
  onSelect: (id: ExpenseTrackerCategory) => void;
}

export function ExpenseCategoryTiles({ selected, onSelect }: ExpenseCategoryTilesProps) {
  return (
    <View style={styles.section}>
      <AppText variant="body" weight="800" color={HomeTheme.text} style={styles.title}>
        Categories
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {EXPENSE_TRACKER_CATEGORIES.map((item) => {
          const active = item.id === selected;
          const tileBg = active ? HomeTheme.green : item.bg;
          const iconColor = active ? HomeTheme.white : item.color;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => onSelect(item.id)}
              style={[styles.tile, { backgroundColor: tileBg }, !active && styles.tileInactive]}
            >
              <MaterialCommunityIcons name={item.materialIcon} size={24} color={iconColor} />
              <AppText
                variant="caption"
                weight="700"
                color={active ? HomeTheme.white : HomeTheme.text}
                style={styles.label}
              >
                {item.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 17,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  tile: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tileInactive: {
    ...homeCardShadow,
  },
  label: {
    fontSize: 11,
  },
});
