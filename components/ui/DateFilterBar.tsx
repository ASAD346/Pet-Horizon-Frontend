import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { AppText } from './AppText';
import { Spacing, Radius } from '@/constants/theme';

export type DatePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateFilterBarProps {
  selected: DatePreset;
  customRange?: DateRange;
  onChange: (preset: DatePreset, range: DateRange) => void;
  accentColor?: string;
}

function getTodayRange(): DateRange {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

function getYesterdayRange(): DateRange {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

function getLast7Range(): DateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { startDate: start, endDate: end };
}

function getLast30Range(): DateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { startDate: start, endDate: end };
}

export function getPresetRange(preset: DatePreset, custom?: DateRange): DateRange {
  switch (preset) {
    case 'today': return getTodayRange();
    case 'yesterday': return getYesterdayRange();
    case 'last7': return getLast7Range();
    case 'last30': return getLast30Range();
    case 'custom': return custom ?? getTodayRange();
  }
}

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'Custom Date', value: 'custom' },
];

/** Simple YYYY-MM-DD string validator */
function parseSimpleDate(str: string): Date | null {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
  const date = new Date(y, mo, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function DateFilterBar({
  selected,
  customRange,
  onChange,
  accentColor = '#2E7D32',
}: DateFilterBarProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handlePresetPress = (preset: DatePreset) => {
    if (preset === 'custom') {
      setStartInput('');
      setEndInput('');
      setInputError('');
      setShowCustomModal(true);
      return;
    }
    onChange(preset, getPresetRange(preset));
  };

  const handleApplyCustom = () => {
    const start = parseSimpleDate(startInput);
    const end = parseSimpleDate(endInput);
    if (!start) {
      setInputError('Invalid start date. Use YYYY-MM-DD format.');
      return;
    }
    if (!end) {
      setInputError('Invalid end date. Use YYYY-MM-DD format.');
      return;
    }
    if (start > end) {
      setInputError('Start date must be before end date.');
      return;
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    setShowCustomModal(false);
    onChange('custom', { startDate: start, endDate: end });
  };

  const getCustomLabel = () => {
    if (!customRange) return 'Custom Date';
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(customRange.startDate)} – ${fmt(customRange.endDate)}`;
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {PRESETS.map((preset) => {
          const isActive = preset.value === selected;
          const label = preset.value === 'custom' && selected === 'custom'
            ? getCustomLabel()
            : preset.label;
          return (
            <TouchableOpacity
              key={preset.value}
              onPress={() => handlePresetPress(preset.value)}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: accentColor + '18', borderColor: accentColor }
                  : styles.chipInactive,
              ]}
              activeOpacity={0.75}
            >
              <AppText
                variant="caption"
                weight={isActive ? '700' : '500'}
                color={isActive ? accentColor : '#616161'}
                style={styles.label}
              >
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText variant="h3" weight="700" color="#212121" style={styles.modalTitle}>
              Custom Date Range
            </AppText>
            <AppText variant="caption" color="#616161" style={styles.modalHint}>
              Enter dates in YYYY-MM-DD format
            </AppText>

            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <AppText variant="caption" weight="600" color="#616161" style={styles.inputLabel}>
                  Start Date
                </AppText>
                <TextInput
                  style={styles.input}
                  placeholder="2026-06-01"
                  placeholderTextColor="#BDBDBD"
                  value={startInput}
                  onChangeText={(t) => { setStartInput(t); setInputError(''); }}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
              <View style={styles.inputWrap}>
                <AppText variant="caption" weight="600" color="#616161" style={styles.inputLabel}>
                  End Date
                </AppText>
                <TextInput
                  style={styles.input}
                  placeholder="2026-06-25"
                  placeholderTextColor="#BDBDBD"
                  value={endInput}
                  onChangeText={(t) => { setEndInput(t); setInputError(''); }}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
            </View>

            {inputError ? (
              <AppText variant="caption" color="#D32F2F" style={styles.errorText}>
                {inputError}
              </AppText>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCustomModal(false)}
                activeOpacity={0.75}
              >
                <AppText variant="bodySmall" weight="600" color="#616161">Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: accentColor }]}
                onPress={handleApplyCustom}
                activeOpacity={0.8}
              >
                <AppText variant="bodySmall" weight="700" color="#FFFFFF">Apply</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 380,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  modalTitle: {
    marginBottom: 4,
  },
  modalHint: {
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    flex: 1,
  },
  inputLabel: {
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F5F6F8',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: '#212121',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  errorText: {
    marginBottom: Spacing.sm,
    color: '#D32F2F',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
