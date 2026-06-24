import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { EXPENSE_TRACKER_CATEGORIES, type ExpenseTrackerCategory } from './expenseTrackerData';

interface ExpenseCategoryTilesProps {
  selected: ExpenseTrackerCategory;
  onSelect: (id: ExpenseTrackerCategory) => void;
}

const BRAND_GREEN = '#2E7D32';

const tileActiveShadow = Platform.select({
  ios: {
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
});

export function ExpenseCategoryTiles({ selected, onSelect }: ExpenseCategoryTilesProps) {
  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        <AppText variant="body" weight="800" color={HomeTheme.text} style={styles.title}>
          Categories
        </AppText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {EXPENSE_TRACKER_CATEGORIES.map((item) => {
          const active = item.id === selected;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => onSelect(item.id)}
              style={[
                styles.tile,
                { backgroundColor: active ? BRAND_GREEN : item.bg },
                active ? tileActiveShadow : styles.tileInactive,
              ]}
            >
              {/* Small active indicator ring */}
              {active && <View style={styles.activeRing} />}

              <MaterialCommunityIcons
                name={item.materialIcon}
                size={24}
                color={active ? '#FFFFFF' : BRAND_GREEN}
              />
              <AppText
                variant="caption"
                weight="700"
                color={active ? '#FFFFFF' : HomeTheme.text}
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_GREEN,
  },
  title: {
    fontSize: 16,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
    paddingBottom: 4, // allow shadow to show
  },
  tile: {
    width: 76,
    height: 76,
    borderRadius: Radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    overflow: 'visible',
  },
  tileInactive: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  activeRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.md + 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_GREEN,
  },
});
