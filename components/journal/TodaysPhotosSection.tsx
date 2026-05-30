import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';

interface TodaysPhotosSectionProps {
  slotCount?: number;
}

export function TodaysPhotosSection({ slotCount = 3 }: TodaysPhotosSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="body" weight="800" color={JournalTheme.text} style={styles.title}>
          Today&apos;s Photos
        </AppText>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.7}>
          <Ionicons name="add" size={18} color={JournalTheme.textMuted} />
          <AppText variant="bodySmall" weight="600" color={JournalTheme.textMuted}>
            Add Photo
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photoRow}
      >
        {Array.from({ length: slotCount }, (_, i) => (
          <View key={i} style={styles.photoSlot}>
            <Ionicons name="image-outline" size={32} color={JournalTheme.textLight} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 17,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoRow: {
    gap: Spacing.sm,
  },
  photoSlot: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    backgroundColor: JournalTheme.photoPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
