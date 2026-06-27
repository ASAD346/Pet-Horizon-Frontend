import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';

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
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragHandle} />
          
          <View style={styles.sheetHeader}>
            <AppText variant="h3" weight="800" style={styles.sheetTitle}>{title}</AppText>
            {subtitle ? <AppText variant="bodySmall" color="#64748B">{subtitle}</AppText> : null}
          </View>

          <TouchableOpacity 
            style={styles.actionRow} 
            activeOpacity={0.7}
            onPress={() => { onClose(); onTakePhoto(); }}
          >
            <Ionicons name="camera-outline" size={22} color="#1E293B" />
            <AppText variant="body" weight="600" style={styles.actionText}>Take photo</AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionRow} 
            activeOpacity={0.7}
            onPress={() => { onClose(); onChooseFromLibrary(); }}
          >
            <Ionicons name="images-outline" size={22} color="#1E293B" />
            <AppText variant="body" weight="600" style={styles.actionText}>Choose from library</AppText>
          </TouchableOpacity>

          {onRemovePhoto ? (
            <TouchableOpacity 
              style={styles.actionRow} 
              activeOpacity={0.7}
              onPress={() => { onClose(); onRemovePhoto(); }}
            >
              <Ionicons name="trash-outline" size={22} color="#E53935" />
              <AppText variant="body" weight="600" color="#E53935" style={styles.actionText}>Remove photo</AppText>
            </TouchableOpacity>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionText: {
    marginLeft: 16,
    fontSize: 16,
  },
});
