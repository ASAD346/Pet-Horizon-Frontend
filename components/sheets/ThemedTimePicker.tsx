import React from 'react';
import { Platform, View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeModal } from '../ui/SafeModal';
import { AppText } from '../ui/AppText';
import { Palette, Spacing } from '../../constants/theme';

interface ThemedTimePickerProps {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

export function ThemedTimePicker({
  visible,
  value,
  onClose,
  onConfirm,
}: ThemedTimePickerProps) {
  if (!visible) return null;

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      onClose();
      if (event.type === 'set' && selectedDate) {
        onConfirm(selectedDate);
      }
    } else {
      // iOS: updates local state, user confirms by pressing Done
      if (selectedDate) {
        onConfirm(selectedDate);
      }
    }
  };

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value || new Date()}
        mode="time"
        display="default"
        is24Hour={false}
        onChange={handleChange}
      />
    );
  }

  return (
    <SafeModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color="#1A2B4E">
              Select Time
            </AppText>
          </View>
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={value || new Date()}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={handleChange}
              themeVariant="light"
            />
          </View>
          <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.8}>
            <AppText variant="body" weight="800" color={Palette.white}>
              Done
            </AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </SafeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    marginTop: Spacing.md,
    backgroundColor: '#3A8F3B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
