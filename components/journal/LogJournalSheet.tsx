import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SheetColors } from '../sheets/sheetUi';
import { JournalContent } from './JournalContent';
import { Radius, Spacing } from '../../constants/theme';

interface LogJournalSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LogJournalSheet({ visible, onClose }: LogJournalSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.flex}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <AppText variant="h3" weight="800" color={SheetColors.title} style={styles.headerTitle}>
                Pet Journal
              </AppText>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={SheetColors.chipText} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <JournalContent active={visible} />
            </View>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: SheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '92%',
    flex: 1,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    paddingRight: Spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
