import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { JournalTheme, Spacing } from '../../constants/theme';

interface JournalMonthHeaderProps {
  monthLabel: string;
}

export function JournalMonthHeader({ monthLabel }: JournalMonthHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="h3" weight="800" color={JournalTheme.text}>
        {monthLabel}
      </AppText>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} activeOpacity={0.7} accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={22} color={JournalTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} activeOpacity={0.7} accessibilityLabel="Next month">
          <Ionicons name="chevron-forward" size={22} color={JournalTheme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navBtn: {
    padding: Spacing.xs,
  },
});
