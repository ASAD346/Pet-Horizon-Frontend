import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Radius, Spacing, Palette } from '../../constants/theme';
import { useAppThemeColor } from './useAppThemeColor';

interface ThemedTimePickerProps {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function ThemedTimePicker({ visible, value, onClose, onConfirm }: ThemedTimePickerProps) {
  const { accentColor } = useAppThemeColor();
  
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (visible && value) {
      const hours24 = value.getHours();
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      let hour12 = hours24 % 12;
      if (hour12 === 0) hour12 = 12;
      setSelectedHour(hour12);
      setSelectedMinute(value.getMinutes());
      setSelectedAmPm(ampm);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    let finalHour = selectedHour;
    if (selectedAmPm === 'PM' && finalHour !== 12) {
      finalHour += 12;
    } else if (selectedAmPm === 'AM' && finalHour === 12) {
      finalHour = 0;
    }
    const finalDate = new Date(value || new Date());
    finalDate.setHours(finalHour);
    finalDate.setMinutes(selectedMinute);
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    onConfirm(finalDate);
  };

  const incrementMinute = () => {
    setSelectedMinute((prev) => (prev + 1) % 60);
  };

  const decrementMinute = () => {
    setSelectedMinute((prev) => (prev - 1 + 60) % 60);
  };

  const formatNum = (num: number) => String(num).padStart(2, '0');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          
          <View style={styles.sheetHeader}>
            <Ionicons name="time-outline" size={20} color={accentColor} />
            <AppText variant="h3" weight="800" color="#1A2B4E">
              Select Time
            </AppText>
          </View>

          {/* Large Time Display */}
          <View style={styles.timeDisplayContainer}>
            <AppText variant="h1" weight="800" color={accentColor} style={styles.timeDisplayText}>
              {formatNum(selectedHour)} : {formatNum(selectedMinute)}{' '}
              <AppText variant="h3" weight="800" color="#1A2B4E">
                {selectedAmPm}
              </AppText>
            </AppText>
          </View>

          {/* Hour Selection */}
          <View style={styles.sectionContainer}>
            <AppText variant="caption" weight="800" color={Palette.gray[500]} style={styles.sectionLabel}>
              HOUR
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
              {HOURS.map((h) => {
                const isActive = selectedHour === h;
                return (
                  <TouchableOpacity
                    key={`h-${h}`}
                    style={[styles.chip, isActive && { backgroundColor: accentColor, borderColor: accentColor }]}
                    onPress={() => setSelectedHour(h)}
                    activeOpacity={0.8}
                  >
                    <AppText variant="bodySmall" weight="700" color={isActive ? '#FFFFFF' : '#1A2B4E'}>
                      {h}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Minute Selection */}
          <View style={styles.sectionContainer}>
            <View style={styles.minuteHeaderRow}>
              <AppText variant="caption" weight="800" color={Palette.gray[500]} style={styles.sectionLabel}>
                MINUTE
              </AppText>
              
              <View style={styles.adjustRow}>
                <TouchableOpacity style={styles.adjustBtn} onPress={decrementMinute} hitSlop={8}>
                  <Ionicons name="remove-circle-outline" size={20} color="#1A2B4E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.adjustBtn} onPress={incrementMinute} hitSlop={8}>
                  <Ionicons name="add-circle-outline" size={20} color="#1A2B4E" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
              {MINUTES.map((m) => {
                const isActive = selectedMinute === m;
                return (
                  <TouchableOpacity
                    key={`m-${m}`}
                    style={[styles.chip, isActive && { backgroundColor: accentColor, borderColor: accentColor }]}
                    onPress={() => setSelectedMinute(m)}
                    activeOpacity={0.8}
                  >
                    <AppText variant="bodySmall" weight="700" color={isActive ? '#FFFFFF' : '#1A2B4E'}>
                      {formatNum(m)}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* AM / PM Selection */}
          <View style={styles.sectionContainer}>
            <AppText variant="caption" weight="800" color={Palette.gray[500]} style={styles.sectionLabel}>
              PERIOD
            </AppText>
            <View style={styles.periodRow}>
              {(['AM', 'PM'] as const).map((period) => {
                const isActive = selectedAmPm === period;
                return (
                  <TouchableOpacity
                    key={period}
                    style={[styles.periodChip, isActive && { backgroundColor: accentColor, borderColor: accentColor }]}
                    onPress={() => setSelectedAmPm(period)}
                    activeOpacity={0.8}
                  >
                    <AppText variant="bodySmall" weight="700" color={isActive ? '#FFFFFF' : '#1A2B4E'}>
                      {period}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <AppText variant="bodySmall" weight="700" color="#1A2B4E">
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: accentColor }]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <AppText variant="bodySmall" weight="800" color="#FFFFFF">
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
    backgroundColor: 'rgba(26, 43, 78, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  timeDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeDisplayText: {
    fontSize: 28,
  },
  sectionContainer: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  minuteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustBtn: {
    padding: 2,
  },
  scrollRow: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FCFCFD',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    minWidth: 44,
    alignItems: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FCFCFD',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FCFCFD',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5CB35D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
});
