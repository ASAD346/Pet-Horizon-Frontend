import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';

interface ScheduleEntrySummaryCardProps {
  title: string;
  subtitle: string;
  accentColor: string;
  accentBg: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export function ScheduleEntrySummaryCard({
  title,
  subtitle,
  accentColor,
  accentBg,
  onEdit,
  onDelete,
  deleting,
}: ScheduleEntrySummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: accentBg }]}>
        <Ionicons name="time-outline" size={18} color={accentColor} />
      </View>
      <View style={styles.body}>
        <AppText variant="bodySmall" weight="800" color={HomeTheme.text} numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" color={HomeTheme.textMuted} numberOfLines={2}>
          {subtitle}
        </AppText>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={onEdit}
          disabled={deleting}
          activeOpacity={0.85}
          accessibilityLabel="Edit schedule"
        >
          <Ionicons name="create-outline" size={18} color={accentColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={onDelete}
          disabled={deleting}
          activeOpacity={0.85}
          accessibilityLabel="Delete schedule"
        >
          <Ionicons name="trash-outline" size={18} color="#E53935" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HomeTheme.white,
    borderRadius: 14,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: '#F5F5F5',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
  },
});
