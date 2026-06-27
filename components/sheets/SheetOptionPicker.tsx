import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { SheetColors } from './sheetUi';

export type SheetOption = {
  value: string;
  label: string;
};

interface SheetOptionPickerProps {
  visible: boolean;
  title: string;
  options: SheetOption[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  useNativeModal?: boolean;
}

export function SheetOptionPicker({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  useNativeModal = true,
}: SheetOptionPickerProps) {
  if (!visible) return null;

  const content = (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        <View style={styles.header}>
          <AppText variant="body" weight="800" color={SheetColors.title}>
            {title}
          </AppText>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={SheetColors.chipText} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {options.map((option) => {
            const selected = option.value === selectedValue;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.row, selected && styles.rowSelected]}
                activeOpacity={0.85}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <AppText
                  variant="bodySmall"
                  weight={selected ? '700' : '600'}
                  color={selected ? HomeTheme.green : SheetColors.inputText}
                >
                  {option.label}
                </AppText>
                {selected ? (
                  <Ionicons name="checkmark" size={20} color={HomeTheme.green} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  );

  if (useNativeModal) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {content}
    </View>
  );
}

const sheetShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  android: { elevation: 8 },
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SheetColors.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 99999,
  },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderRadius: Radius.lg,
    maxHeight: '60%',
    ...sheetShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SheetColors.border,
  },
  list: {
    paddingVertical: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  rowSelected: {
    backgroundColor: '#F0FAF0',
  },
});
