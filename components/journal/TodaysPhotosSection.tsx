import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { JournalTheme, Radius, Spacing } from '../../constants/theme';
import type { ApiJournalEntry } from '@/types/journal';
import { AnimatedStackItem } from '../ui/AnimatedStackItem';

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
  themeColor?: string;
  isPremium?: boolean;
  maxPhotos?: number;
}

export function TodaysPhotosSection({
  title = "Today's Photos",
  photos = [],
  canAddPhoto = false,
  uploading = false,
  onAddPhoto,
  onPhotoPress,
  themeColor = '#2E7D32',
  isPremium = false,
  maxPhotos,
}: TodaysPhotosSectionProps) {
  const hasPhotos = photos.length > 0;
  const maxAllowed = maxPhotos ?? (isPremium ? 5 : 1);
  const canAddMore = canAddPhoto && photos.length < maxAllowed;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="body" weight="800" color={JournalTheme.text} style={styles.title}>
            {title}
          </AppText>
          {hasPhotos && (
            <View style={styles.counterBadge}>
              <AppText variant="caption" weight="700" color={JournalTheme.textMuted} style={styles.counterText}>
                {photos.length}/{maxAllowed}
              </AppText>
            </View>
          )}
        </View>

        {canAddPhoto ? (
          <TouchableOpacity
            style={[styles.headerAddBtn, { backgroundColor: themeColor }]}
            activeOpacity={0.8}
            onPress={onAddPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.btnIcon} />
            ) : (
              <Ionicons name="camera" size={16} color="#FFFFFF" style={styles.btnIcon} />
            )}
            <AppText variant="caption" weight="700" color="#FFFFFF">
              {uploading ? 'Adding...' : 'Add Photo'}
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>

      {hasPhotos ? (
        <View style={styles.photoRow}>
          {photos.map((photo, index) => (
            <AnimatedStackItem
              key={`${photo.entryId}-${photos.length}`}
              index={index}
              direction="up"
              staggerMs={55}
              distance={22}
            >
              <View style={styles.photoContainer}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => onPhotoPress?.(photo)}
                  style={styles.photoClickable}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                </TouchableOpacity>
              </View>
            </AnimatedStackItem>
          ))}

          {canAddMore ? (
            <TouchableOpacity
              style={[styles.addPhotoCard, { borderColor: themeColor }]}
              activeOpacity={0.75}
              onPress={onAddPhoto}
              disabled={uploading}
            >
              <View style={[styles.addPhotoCardIcon, { backgroundColor: themeColor + '18' }]}>
                {uploading ? (
                  <ActivityIndicator size="small" color={themeColor} />
                ) : (
                  <Ionicons name="add" size={24} color={themeColor} />
                )}
              </View>
              <AppText variant="caption" weight="700" color={themeColor} style={styles.addCardText}>
                {uploading ? 'Adding...' : 'Add Photo'}
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : canAddPhoto ? (
        <TouchableOpacity
          style={[styles.emptySlotInteractive, { borderColor: themeColor + '60' }]}
          activeOpacity={0.8}
          onPress={onAddPhoto}
          disabled={uploading}
        >
          <View style={[styles.emptyIconCircle, { backgroundColor: themeColor + '15' }]}>
            {uploading ? (
              <ActivityIndicator size="small" color={themeColor} />
            ) : (
              <Ionicons name="camera" size={28} color={themeColor} />
            )}
          </View>
          <AppText variant="body" weight="700" color={JournalTheme.text} style={styles.emptyTitle}>
            {uploading ? 'Uploading Photo...' : 'Add Today’s Photo'}
          </AppText>
          <AppText variant="caption" color={JournalTheme.textMuted} style={styles.emptySubtitle}>
            {uploading ? 'Please wait a moment' : 'Capture or select a memory from your gallery'}
          </AppText>
          <View style={[styles.emptyActionPill, { backgroundColor: themeColor }]}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <AppText variant="caption" weight="700" color="#FFFFFF">
              Upload Photo
            </AppText>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.emptySlot}>
          <Ionicons name="images-outline" size={32} color={JournalTheme.textLight} />
          <AppText variant="caption" color={JournalTheme.textMuted} style={styles.emptyText}>
            No photos for this day
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
  },
  counterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  counterText: {
    fontSize: 11,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  btnIcon: {
    marginRight: 4,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    overflow: 'hidden',
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
  addPhotoCard: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
  },
  addPhotoCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addCardText: {
    fontSize: 11,
    textAlign: 'center',
  },
  emptySlotInteractive: {
    width: '100%',
    minHeight: 140,
    borderRadius: Radius.lg,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    marginTop: 2,
  },
  emptySubtitle: {
    marginTop: 2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
    marginTop: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
