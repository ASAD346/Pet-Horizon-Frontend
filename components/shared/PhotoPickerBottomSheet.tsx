import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface PhotoPickerBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromLibrary: () => void;
  onRemovePhoto?: (() => void) | null;
  title?: string;
  subtitle?: string;
}

export function PhotoPickerBottomSheet({
  isVisible,
  onClose,
  onTakePhoto,
  onChooseFromLibrary,
  onRemovePhoto,
  title = 'Profile Photo',
  subtitle = 'Update your avatar picture',
}: PhotoPickerBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom + 8, 24) }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <AppText variant="h3" weight="800" color="#0F172A" style={styles.sheetTitle}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="bodySmall" color="#64748B" style={styles.sheetSubtitle}>
                {subtitle}
              </AppText>
            ) : null}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {/* Camera row */}
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={() => { onClose(); onTakePhoto(); }}
            >
              <View style={[styles.iconBadge, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="camera-outline" size={22} color="#2563EB" />
              </View>
              <View style={styles.actionTextBlock}>
                <AppText variant="body" weight="700" color="#0F172A">
                  Take Photo
                </AppText>
                <AppText variant="caption" color="#94A3B8" style={styles.actionSubtitle}>
                  Use your camera to snap a new photo
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Library row */}
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={() => { onClose(); onChooseFromLibrary(); }}
            >
              <View style={[styles.iconBadge, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="images-outline" size={22} color="#16A34A" />
              </View>
              <View style={styles.actionTextBlock}>
                <AppText variant="body" weight="700" color="#0F172A">
                  Choose from Gallery
                </AppText>
                <AppText variant="caption" color="#94A3B8" style={styles.actionSubtitle}>
                  Pick an existing photo from your library
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Remove photo row (conditional) */}
            {onRemovePhoto ? (
              <TouchableOpacity
                style={[styles.actionRow, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => { onClose(); onRemovePhoto(); }}
              >
                <View style={[styles.iconBadge, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="trash-outline" size={22} color="#DC2626" />
                </View>
                <View style={styles.actionTextBlock}>
                  <AppText variant="body" weight="700" color="#DC2626">
                    Remove Photo
                  </AppText>
                  <AppText variant="caption" color="#94A3B8" style={styles.actionSubtitle}>
                    Delete your current profile picture
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Cancel button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="body" weight="700" color="#64748B">
              Cancel
            </AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 19,
    marginBottom: 3,
  },
  sheetSubtitle: {
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  actionsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 14,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTextBlock: {
    flex: 1,
    gap: 2,
  },
  actionSubtitle: {
    lineHeight: 15,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
