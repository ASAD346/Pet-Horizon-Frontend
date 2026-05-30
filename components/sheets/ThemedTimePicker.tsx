import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

interface ThemedTimePickerProps {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

export function ThemedTimePicker({ visible, value, onClose, onConfirm }: ThemedTimePickerProps) {
  const [selected, setSelected] = useState(value);

  useEffect(() => {
    if (visible) setSelected(value);
  }, [visible, value]);

  const handleAndroidChange = (_event: unknown, date?: Date) => {
    onClose();
    if (date) onConfirm(date);
  };

  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={selected}
        mode="time"
        is24Hour={false}
        display="default"
        onChange={handleAndroidChange}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Ionicons name="time-outline" size={22} color={LoginTheme.green} />
            <AppText variant="h3" weight="700" color={LoginTheme.charcoal}>
              Select time
            </AppText>
          </View>

          <DateTimePicker
            value={selected}
            mode="time"
            display="spinner"
            onChange={(_, date) => date && setSelected(date)}
            style={styles.picker}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <AppText variant="body" weight="600" color={LoginTheme.charcoal}>
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onConfirm(selected)}
              activeOpacity={0.85}
            >
              <AppText variant="body" weight="700" color={LoginTheme.footerText}>
                Confirm
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  sheet: {
    backgroundColor: LoginTheme.screenBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E8EDE8',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  picker: {
    height: 180,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: LoginTheme.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: LoginTheme.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
