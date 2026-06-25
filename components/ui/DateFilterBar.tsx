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
import { Spacing, Radius, Palette } from '@/constants/theme';

export type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DatePresetOption {
  label: string;
  value: DatePreset;
}

const DEFAULT_PRESETS: DatePresetOption[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: '7 Days', value: 'last7' },
  { label: '30 Days', value: 'last30' },
  { label: 'Custom', value: 'custom' },
];

export function getPresetRange(preset: DatePreset, custom?: DateRange): DateRange {
  const now = new Date();
  switch (preset) {
    case 'all':
      return { startDate: new Date(2020, 0, 1), endDate: new Date(2030, 11, 31, 23, 59, 59) };
    case 'today': {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e };
    }
    case 'yesterday': {
      const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
      const e = new Date(s); e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e };
    }
    case 'last7': {
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      const s = new Date(now); s.setDate(s.getDate() - 6); s.setHours(0, 0, 0, 0);
      return { startDate: s, endDate: e };
    }
    case 'last30': {
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      const s = new Date(now); s.setDate(s.getDate() - 29); s.setHours(0, 0, 0, 0);
      return { startDate: s, endDate: e };
    }
    case 'custom':
      return custom ?? getPresetRange('today');
  }
}

function parseSimpleDate(str: string): Date | null {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mo - 1, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

interface DateFilterBarProps {
  selected: DatePreset;
  customRange?: DateRange;
  onChange: (preset: DatePreset, range: DateRange) => void;
  accentColor?: string;
  presets?: DatePresetOption[];
}

export function DateFilterBar({
  selected,
  customRange,
  onChange,
  accentColor = Palette.primary.base,
  presets = DEFAULT_PRESETS,
}: DateFilterBarProps) {
  const [showModal, setShowModal] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [error, setError] = useState('');

  const handlePress = (preset: DatePreset) => {
    if (preset === 'custom') {
      setStartInput('');
      setEndInput('');
      setError('');
      setShowModal(true);
      return;
    }
    onChange(preset, getPresetRange(preset));
  };

  const handleApply = () => {
    const s = parseSimpleDate(startInput);
    const e = parseSimpleDate(endInput);
    if (!s) { setError('Invalid start date — use YYYY-MM-DD'); return; }
    if (!e) { setError('Invalid end date — use YYYY-MM-DD'); return; }
    if (s > e) { setError('Start date must be before end date'); return; }
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    setShowModal(false);
    onChange('custom', { startDate: s, endDate: e });
  };

  const customLabel = () => {
    if (!customRange) return 'Custom';
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(customRange.startDate)}–${fmt(customRange.endDate)}`;
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {presets.map((p) => {
          const active = p.value === selected;
          const label = p.value === 'custom' && selected === 'custom' ? customLabel() : p.label;
          return (
            <TouchableOpacity
              key={p.value}
              onPress={() => handlePress(p.value)}
              activeOpacity={0.75}
              style={[styles.chip, active
                ? { backgroundColor: accentColor + '18', borderColor: accentColor }
                : styles.inactive,
              ]}
            >
              <AppText
                variant="caption"
                weight={active ? '700' : '500'}
                color={active ? accentColor : '#616161'}
                style={styles.chipLabel}
              >
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <AppText variant="h3" weight="700" color="#212121">Custom Range</AppText>
            <AppText variant="caption" color="#9E9E9E" style={{ marginTop: 2, marginBottom: Spacing.md }}>
              Enter dates in YYYY-MM-DD format
            </AppText>
            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="caption" weight="600" color="#616161" style={styles.inputLabel}>From</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="2026-06-01"
                  placeholderTextColor="#BDBDBD"
                  value={startInput}
                  onChangeText={(t) => { setStartInput(t); setError(''); }}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="caption" weight="600" color="#616161" style={styles.inputLabel}>To</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="2026-06-25"
                  placeholderTextColor="#BDBDBD"
                  value={endInput}
                  onChangeText={(t) => { setEndInput(t); setError(''); }}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
            </View>
            {error ? <AppText variant="caption" color="#DC2626" style={{ marginBottom: 8 }}>{error}</AppText> : null}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)} activeOpacity={0.75}>
                <AppText variant="bodySmall" weight="600" color="#616161">Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.applyBtn, { backgroundColor: accentColor }]} onPress={handleApply} activeOpacity={0.8}>
                <AppText variant="bodySmall" weight="700" color="#FFF">Apply</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, paddingBottom: 2, paddingHorizontal: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  inactive: { backgroundColor: Palette.gray[50], borderColor: Palette.gray[200] },
  chipLabel: { fontSize: 12, letterSpacing: 0.2 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modal: {
    backgroundColor: '#FFF', borderRadius: 20,
    padding: Spacing.lg, width: '100%', maxWidth: 380,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 },
      android: { elevation: 10 },
    }),
  },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  inputLabel: { marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#F5F6F8', borderRadius: Radius.sm,
    borderWidth: 1, borderColor: '#E0E0E0',
    paddingHorizontal: Spacing.sm, paddingVertical: 10,
    fontSize: 14, color: '#212121',
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: '#F5F5F5', alignItems: 'center' },
  applyBtn: { flex: 2, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center' },
});
