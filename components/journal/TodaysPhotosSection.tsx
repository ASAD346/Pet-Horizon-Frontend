import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';
import type { ApiJournalEntry } from '@/types/journal';

export interface JournalPhoto {
  uri: string;
  entryId: string;
  entry: ApiJournalEntry;
}

interface TodaysPhotosSectionProps {
  title?: string;
  photos?: JournalPhoto[];
  canAddPhoto?: boolean;
  uploading?: boolean;
  onAddPhoto?: () => void;
  onPhotoPress?: (photo: JournalPhoto) => void;
  onDeletePhoto?: (photo: JournalPhoto) => void;
}

export function TodaysPhotosSection({
  title = "Today's Photos",
  photos = [],
  canAddPhoto = false,
  uploading = false,
  onAddPhoto,
  onPhotoPress,
  onDeletePhoto,
}: TodaysPhotosSectionProps) {
  const hasPhotos = photos.length > 0;

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
          {photos.map((photo) => (
            <View key={photo.entryId} style={styles.photoContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onPhotoPress?.(photo)}
                style={styles.photoClickable}
              >
                <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
              </TouchableOpacity>
              {canAddPhoto ? (
                <TouchableOpacity
                  style={styles.deleteBadge}
                  activeOpacity={0.7}
                  onPress={() => onDeletePhoto?.(photo)}
                >
                  <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </View>
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
    paddingHorizontal: Spacing.xs,
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
    gap: Spacing.md,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoClickable: {
    width: '100%',
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    backgroundColor: JournalTheme.photoPlaceholder,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  emptySlot: {
    width: '100%',
    minHeight: 100,
    borderRadius: Radius.md,
    backgroundColor: JournalTheme.photoPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  emptyText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
