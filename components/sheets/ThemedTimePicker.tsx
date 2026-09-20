import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Palette, Spacing } from '../../constants/theme';

interface ThemedTimePickerProps {
  visible: boolean;
  value: Date;
  title?: string;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES_5MIN = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const PRESETS = [
  { label: '7:00 AM', hour: 7, minute: 0, period: 'AM' as const },
  { label: '12:00 PM', hour: 12, minute: 0, period: 'PM' as const },
  { label: '6:00 PM', hour: 6, minute: 0, period: 'PM' as const },
  { label: '9:00 PM', hour: 9, minute: 0, period: 'PM' as const },
];

export function ThemedTimePicker({
  visible,
  value,
  title = 'Select Time',
  onClose,
  onConfirm,
}: ThemedTimePickerProps) {
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [activeTab, setActiveTab] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    if (visible) {
      const date = value instanceof Date && !isNaN(value.getTime()) ? value : new Date();
      let h = date.getHours();
      const m = date.getMinutes();
      const p = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;

      setSelectedHour(h);
      setSelectedMinute(m);
      setSelectedPeriod(p);
      setActiveTab('hour');
    }
  }, [visible, value]);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setSelectedHour(preset.hour);
    setSelectedMinute(preset.minute);
    setSelectedPeriod(preset.period);
  };

  const handleHourSelect = (h: number) => {
    setSelectedHour(h);
    // Auto transition to minute selection for fast 2-tap time entry
    setActiveTab('minute');
  };

  const handleAdjustMinute = (delta: number) => {
    setSelectedMinute((prev) => {
      let next = prev + delta;
      if (next < 0) next = 59;
      if (next > 59) next = 0;
      return next;
    });
  };

  const handleConfirm = () => {
    const baseDate = value instanceof Date && !isNaN(value.getTime()) ? new Date(value) : new Date();
    let h = selectedHour % 12;
    if (selectedPeriod === 'PM') {
      h += 12;
    }
    baseDate.setHours(h, selectedMinute, 0, 0);
    onConfirm(baseDate);
    onClose();
  };

  const formattedTimePreview = useMemo(() => {
    const hStr = selectedHour < 10 ? `0${selectedHour}` : `${selectedHour}`;
    const mStr = selectedMinute < 10 ? `0${selectedMinute}` : `${selectedMinute}`;
    return { hStr, mStr };
  }, [selectedHour, selectedMinute]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <AppText variant="caption" weight="600" color="#64748B" style={styles.headerSubtitle}>
                {title.toUpperCase()}
              </AppText>
              <View style={styles.digitalDisplayRow}>
                {/* Hour Badge */}
                <TouchableOpacity
                  style={[
                    styles.timeSegmentButton,
                    activeTab === 'hour' && styles.timeSegmentButtonActive,
                  ]}
                  onPress={() => setActiveTab('hour')}
                  activeOpacity={0.7}
                >
                  <AppText
                    variant="h2"
                    weight="800"
                    color={activeTab === 'hour' ? '#3A8F3B' : '#1E293B'}
                  >
                    {formattedTimePreview.hStr}
                  </AppText>
                </TouchableOpacity>

                <AppText variant="h2" weight="800" color="#94A3B8" style={{ marginHorizontal: 4 }}>
                  :
                </AppText>

                {/* Minute Badge */}
                <TouchableOpacity
                  style={[
                    styles.timeSegmentButton,
                    activeTab === 'minute' && styles.timeSegmentButtonActive,
                  ]}
                  onPress={() => setActiveTab('minute')}
                  activeOpacity={0.7}
                >
                  <AppText
                    variant="h2"
                    weight="800"
                    color={activeTab === 'minute' ? '#3A8F3B' : '#1E293B'}
                  >
                    {formattedTimePreview.mStr}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* AM / PM Segmented Switch */}
            <View style={styles.periodSwitcher}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'AM' && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod('AM')}
                activeOpacity={0.8}
              >
                <AppText
                  variant="caption"
                  weight="800"
                  color={selectedPeriod === 'AM' ? '#FFFFFF' : '#64748B'}
                >
                  AM
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'PM' && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod('PM')}
                activeOpacity={0.8}
              >
                <AppText
                  variant="caption"
                  weight="800"
                  color={selectedPeriod === 'PM' ? '#FFFFFF' : '#64748B'}
                >
                  PM
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Presets Row */}
          <View style={styles.presetsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
              {PRESETS.map((p) => {
                const isMatch =
                  selectedHour === p.hour &&
                  selectedMinute === p.minute &&
                  selectedPeriod === p.period;

                return (
                  <TouchableOpacity
                    key={p.label}
                    style={[styles.presetChip, isMatch && styles.presetChipActive]}
                    onPress={() => handlePresetSelect(p)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={isMatch ? '#3A8F3B' : '#64748B'}
                      style={{ marginRight: 4 }}
                    />
                    <AppText
                      variant="caption"
                      weight={isMatch ? '800' : '600'}
                      color={isMatch ? '#3A8F3B' : '#475569'}
                    >
                      {p.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tabs Indicator (Hour vs Minute) */}
          <View style={styles.tabSelectorRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'hour' && styles.tabButtonActive]}
              onPress={() => setActiveTab('hour')}
              activeOpacity={0.7}
            >
              <AppText
                variant="bodySmall"
                weight={activeTab === 'hour' ? '800' : '600'}
                color={activeTab === 'hour' ? '#3A8F3B' : '#64748B'}
              >
                Hours (1 - 12)
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'minute' && styles.tabButtonActive]}
              onPress={() => setActiveTab('minute')}
              activeOpacity={0.7}
            >
              <AppText
                variant="bodySmall"
                weight={activeTab === 'minute' ? '800' : '600'}
                color={activeTab === 'minute' ? '#3A8F3B' : '#64748B'}
              >
                Minutes (00 - 55)
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Main Grid: Hour or Minute */}
          {activeTab === 'hour' ? (
            <View style={styles.gridContainer}>
              {HOURS.map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <View key={h} style={styles.gridCellWrapper}>
                    <TouchableOpacity
                      style={[styles.gridCell, isSelected && styles.gridCellSelected]}
                      onPress={() => handleHourSelect(h)}
                      activeOpacity={0.7}
                    >
                      <AppText
                        variant="body"
                        weight={isSelected ? '800' : '600'}
                        color={isSelected ? '#FFFFFF' : '#1E293B'}
                      >
                        {h}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.minuteSection}>
              <View style={styles.gridContainer}>
                {MINUTES_5MIN.map((m) => {
                  const isSelected = selectedMinute === m;
                  const mStr = m < 10 ? `0${m}` : `${m}`;
                  return (
                    <View key={m} style={styles.gridCellWrapper}>
                      <TouchableOpacity
                        style={[styles.gridCell, isSelected && styles.gridCellSelected]}
                        onPress={() => setSelectedMinute(m)}
                        activeOpacity={0.7}
                      >
                        <AppText
                          variant="body"
                          weight={isSelected ? '800' : '600'}
                          color={isSelected ? '#FFFFFF' : '#1E293B'}
                        >
                          {mStr}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Exact Minute Stepper Adjuster */}
              <View style={styles.stepperContainer}>
                <AppText variant="caption" weight="600" color="#64748B">
                  Fine Tune:
                </AppText>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => handleAdjustMinute(-1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={16} color="#334155" />
                    <AppText variant="caption" weight="700" color="#334155" style={{ marginLeft: 2 }}>
                      -1m
                    </AppText>
                  </TouchableOpacity>

                  <View style={styles.exactMinuteBadge}>
                    <AppText variant="bodySmall" weight="800" color="#3A8F3B">
                      {selectedMinute < 10 ? `0${selectedMinute}` : `${selectedMinute}`} min
                    </AppText>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => handleAdjustMinute(1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color="#334155" />
                    <AppText variant="caption" weight="700" color="#334155" style={{ marginLeft: 2 }}>
                      +1m
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <AppText variant="body" weight="700" color="#64748B">
                Cancel
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <AppText variant="body" weight="800" color="#FFFFFF">
                Confirm Time
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSubtitle: {
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  digitalDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSegmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timeSegmentButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 11,
  },
  periodButtonActive: {
    backgroundColor: '#3A8F3B',
    shadowColor: '#3A8F3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  presetsContainer: {
    marginVertical: 10,
  },
  presetsList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  tabSelectorRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#3A8F3B',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  gridCellWrapper: {
    width: '25%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
  },
  gridCell: {
    width: 52,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCellSelected: {
    backgroundColor: '#3A8F3B',
    borderColor: '#3A8F3B',
    shadowColor: '#3A8F3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  minuteSection: {
    width: '100%',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  exactMinuteBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#3A8F3B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A8F3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
});

