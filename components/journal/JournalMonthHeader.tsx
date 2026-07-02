import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { JournalTheme, Spacing } from '../../constants/theme';

interface JournalMonthHeaderProps {
  monthLabel: string;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function JournalMonthHeader({ monthLabel, onPrevious, onNext }: JournalMonthHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="h3" weight="800" color={JournalTheme.text}>
        {monthLabel}
      </AppText>
      <View style={styles.nav}>
        <TouchableOpacity
          style={styles.navBtn}
          activeOpacity={0.7}
          accessibilityLabel="Previous week"
          onPress={onPrevious}
        >
          <Ionicons name="chevron-back" size={18} color={JournalTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navBtn}
          activeOpacity={0.7}
          accessibilityLabel="Next week"
          onPress={onNext}
        >
          <Ionicons name="chevron-forward" size={18} color={JournalTheme.text} />
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
    marginBottom: Spacing.sm + 2,
    marginTop: 2,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
