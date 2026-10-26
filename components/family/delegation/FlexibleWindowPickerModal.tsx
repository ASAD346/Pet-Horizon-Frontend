import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask, TimeWindowConfig, TimingMode, WindowPreset } from '@/types/delegation';

interface FlexibleWindowPickerModalProps {
  visible: boolean;
  task: DelegationTask | null;
  onClose: () => void;
  onSave: (timingMode: TimingMode, exactTime: string, window: TimeWindowConfig) => void;
  saving?: boolean;
}

const PRESETS: Array<{
  id: WindowPreset;
  title: string;
  startTime: string;
  endTime: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}> = [
  {
    id: 'morning',
    title: 'Morning Window',
    startTime: '07:00',
    endTime: '10:00',
    desc: '7:00 AM – 10:00 AM',
    icon: 'sunny-outline',
    color: '#E65100',
    bg: '#FFF3E0',
  },
  {
    id: 'lunch',
    title: 'Around Lunchtime',
    startTime: '11:30',
    endTime: '14:00',
    desc: '11:30 AM – 2:00 PM',
    icon: 'restaurant-outline',
    color: '#D4A017',
    bg: '#FFF8E1',
  },
  {
    id: 'afternoon',
    title: 'Afternoon Play / Walk',
    startTime: '14:00',
    endTime: '17:00',
    desc: '2:00 PM – 5:00 PM',
    icon: 'paw-outline',
    color: '#2E7D32',
    bg: '#E8F5E9',
  },
  {
    id: 'evening',
    title: 'Evening Routine',
    startTime: '17:00',
    endTime: '20:00',
    desc: '5:00 PM – 8:00 PM',
    icon: 'partly-sunny-outline',
    color: '#1565C0',
    bg: '#E3F2FD',
  },
  {
    id: 'night',
    title: 'Night Care',
    startTime: '20:00',
    endTime: '23:00',
    desc: '8:00 PM – 11:00 PM',
    icon: 'moon-outline',
    color: '#6A1B9A',
    bg: '#F3E5F5',
  },
];

export function FlexibleWindowPickerModal({
  visible,
  task,
  onClose,
  onSave,
  saving = false,
}: FlexibleWindowPickerModalProps) {
  const [mode, setMode] = useState<TimingMode>('window');
  const [selectedPreset, setSelectedPreset] = useState<WindowPreset>('lunch');
  const [startTime, setStartTime] = useState('11:30');
  const [endTime, setEndTime] = useState('14:00');
  const [exactTime, setExactTime] = useState('08:00');

  useEffect(() => {
    if (task) {
      setMode(task.timingMode || 'window');
      setExactTime(task.exactTime || '08:00');
      if (task.window?.preset) {
        setSelectedPreset(task.window.preset);
        setStartTime(task.window.startTime || '11:30');
        setEndTime(task.window.endTime || '14:00');
      }
    }
  }, [task]);

  if (!task) return null;

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setSelectedPreset(p.id);
    setStartTime(p.startTime);
    setEndTime(p.endTime);
  };

  const handleSave = () => {
    onSave(mode, exactTime, {
      preset: mode === 'window' ? selectedPreset : '',
      startTime: mode === 'window' ? startTime : '',
      endTime: mode === 'window' ? endTime : '',
      earlyAllowedMinutes: 45,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={22} color="#184F2E" />
            </View>
            <View style={styles.headerTitles}>
              <AppText variant="h3" weight="800" color="#184F2E">
                Chore Timing Window
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                Switch between exact clock times and relaxed fuzzy windows
              </AppText>
            </View>
          </View>

          {/* Mode Segment Switcher */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'window' && styles.modeTabActive]}
              onPress={() => setMode('window')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="hourglass-outline"
                size={14}
                color={mode === 'window' ? '#184F2E' : Palette.gray[600]}
              />
              <AppText
                variant="bodySmall"
                weight={mode === 'window' ? '800' : '600'}
                color={mode === 'window' ? '#184F2E' : Palette.gray[600]}
              >
                Flexible Window
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'exact' && styles.modeTabActive]}
              onPress={() => setMode('exact')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="alarm-outline"
                size={14}
                color={mode === 'exact' ? '#184F2E' : Palette.gray[600]}
              />
              <AppText
                variant="bodySmall"
                weight={mode === 'exact' ? '800' : '600'}
                color={mode === 'exact' ? '#184F2E' : Palette.gray[600]}
              >
                Exact Time
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Window Presets List */}
          {mode === 'window' ? (
            <ScrollView style={styles.presetsList} showsVerticalScrollIndicator={false}>
              <AppText variant="caption" color={Palette.gray[600]} style={styles.helperText}>
                Choose a time window. Family caretakers can complete this chore anytime within the window without triggering late alerts.
              </AppText>

              {PRESETS.map((p) => {
                const isSelected = selectedPreset === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.presetRow, isSelected && styles.presetRowSelected]}
                    onPress={() => handleSelectPreset(p)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.presetIconWrap, { backgroundColor: p.bg }]}>
                      <Ionicons name={p.icon} size={18} color={p.color} />
                    </View>
                    <View style={styles.presetTextWrap}>
                      <AppText
                        variant="bodySmall"
                        weight="800"
                        color={isSelected ? '#184F2E' : Palette.gray[900]}
                      >
                        {p.title}
                      </AppText>
                      <AppText variant="caption" color={Palette.gray[600]}>
                        {p.desc}
                      </AppText>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color="#184F2E" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.exactModeContainer}>
              <AppText variant="caption" color={Palette.gray[600]} style={{ textAlign: 'center' }}>
                Set a specific clock time for this chore (ideal for medications or strict veterinary diets).
              </AppText>
              <View style={styles.exactTimeChip}>
                <Ionicons name="time" size={22} color="#184F2E" />
                <AppText variant="h2" weight="800" color="#184F2E">
                  {exactTime}
                </AppText>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText variant="bodySmall" weight="700" color={Palette.gray[700]}>
                Cancel
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              <AppText variant="bodySmall" weight="800" color="#FFFFFF">
                {saving ? 'Saving...' : 'Apply Window'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '82%',
    gap: Spacing.sm,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerTitles: {
    flex: 1,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.full,
    padding: 3,
    marginTop: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#184F2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  presetsList: {
    maxHeight: 280,
    marginTop: 4,
  },
  helperText: {
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md - 2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.xs + 2,
    backgroundColor: '#FAFAFA',
  },
  presetRowSelected: {
    borderColor: '#184F2E',
    backgroundColor: '#EEF6EE',
  },
  presetIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTextWrap: {
    flex: 1,
  },
  exactModeContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  exactTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
  },
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: '#2E7D32',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
