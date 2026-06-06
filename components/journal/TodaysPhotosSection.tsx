import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';

interface TodaysPhotosSectionProps {
  title?: string;
  photoUrls?: string[];
  canAddPhoto?: boolean;
  uploading?: boolean;
  onAddPhoto?: () => void;
}

export function TodaysPhotosSection({
  title = "Today's Photos",
  photoUrls = [],
  canAddPhoto = false,
  uploading = false,
  onAddPhoto,
}: TodaysPhotosSectionProps) {
  const hasPhotos = photoUrls.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="body" weight="800" color={JournalTheme.text} style={styles.title}>
          {title}
        </AppText>
        {canAddPhoto ? (
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.7}
            onPress={onAddPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={JournalTheme.textMuted} />
            ) : (
              <Ionicons name="add" size={18} color={JournalTheme.textMuted} />
            )}
            <AppText variant="bodySmall" weight="600" color={JournalTheme.textMuted}>
              Add Photo
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>

      {hasPhotos ? (
        <View style={styles.photoRow}>
          {photoUrls.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" />
          ))}
        </View>
      ) : (
        <View style={styles.emptySlot}>
          <Ionicons name="image-outline" size={32} color={JournalTheme.textLight} />
          <AppText variant="caption" color={JournalTheme.textMuted} style={styles.emptyText}>
            {canAddPhoto ? 'No photos yet for this day' : 'No photos for this day'}
          </AppText>
        </View>
      )}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    backgroundColor: JournalTheme.photoPlaceholder,
  },
  emptySlot: {
    width: '100%',
    minHeight: 100,
    borderRadius: Radius.md,
    backgroundColor: JournalTheme.photoPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  emptyText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
