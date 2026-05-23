import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SectionHeader } from './SectionHeader';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

type ActionIcon = 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' | 'note-plus-outline';

const ACTIONS: { label: string; icon: ActionIcon; color: string; bg: string }[] = [
  { label: 'Log Food', icon: 'silverware-fork-knife', color: '#F5A623', bg: '#FFF4E0' },
  { label: 'Log Walk', icon: 'walk', color: '#5CB35D', bg: '#E8F5E9' },
  { label: 'Medicine', icon: 'pill', color: '#5B9BD5', bg: '#E3F2FD' },
  { label: 'Grooming', icon: 'content-cut', color: '#E91E8C', bg: '#FCE4F0' },
  { label: 'Add Note', icon: 'note-plus-outline', color: '#9C27B0', bg: '#F3E5F5' },
];

export function QuickActionsSection() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Quick Actions" />
      <View style={styles.row}>
        {ACTIONS.map((action) => (
          <TouchableOpacity key={action.label} style={styles.tile} activeOpacity={0.85}>
            <View style={[styles.iconBox, { backgroundColor: action.bg }]}>
              <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
            </View>
            <AppText variant="caption" weight="600" color={HomeTheme.text} style={styles.label}>
              {action.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const tileShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tile: {
    alignItems: 'center',
    width: '18%',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...tileShadow,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
});
