import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Skeleton } from '@/components/ui/skeletons';
import { Palette, Radius, Spacing } from '../../constants/theme';
import { SheetOptionPicker } from '../sheets';

interface BreedSelectorProps {
  value: string;
  breeds: string[];
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  onChange: (breed: string) => void;
}

export function BreedSelector({
  value,
  breeds,
  loading = false,
  disabled = false,
  readOnly = false,
  error,
  onChange,
}: BreedSelectorProps) {
  const [visible, setVisible] = useState(false);

  const placeholder = loading ? 'Loading breeds…' : breeds.length ? 'Select breed' : 'No breeds available';
  const displayValue = value || placeholder;

  // ── Read-only info card ──────────────────────────────────────
  if (readOnly) {
    return (
      <View style={styles.wrapper}>
        <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
          Breed
        </AppText>
        <View style={styles.readOnlyCard}>
          <AppText variant="body" color="#1A2B4E" weight="600" style={styles.readOnlyText} numberOfLines={1}>
            {value || '—'}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <AppText variant="bodySmall" weight="700" color="#1A2B4E" style={styles.label}>
        Breed
      </AppText>

      {loading ? (
        <Skeleton width="100%" height={52} borderRadius={14} />
      ) : (
      <TouchableOpacity
        style={[styles.field, error ? styles.fieldError : null, disabled ? styles.fieldDisabled : null, visible && styles.fieldActive]}
        onPress={() => !disabled && breeds.length > 0 && setVisible(true)}
        activeOpacity={0.8}
        disabled={disabled || breeds.length === 0}
      >
        <AppText
          variant="body"
          color={value ? Palette.gray[800] : Palette.gray[400]}
          weight="600"
          style={styles.fieldText}
          numberOfLines={1}
        >
          {displayValue}
        </AppText>
        <Ionicons name="chevron-down" size={20} color="#5CB35D" />
      </TouchableOpacity>
      )}

      {error ? (
        <AppText variant="caption" color="#C62828" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}

      <SheetOptionPicker
        visible={visible}
        title="Select Breed"
        options={breeds.map((b) => ({ value: b, label: b }))}
        selectedValue={value}
        onClose={() => setVisible(false)}
        onSelect={(val) => {
          onChange(val);
          setVisible(false);
        }}
        useNativeModal={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  // ── Editable field ──────────────────────────────────────────
  field: {
    height: 52,
    backgroundColor: '#FCFCFD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldActive: {
    borderColor: '#5CB35D',
    backgroundColor: Palette.white,
  },
  fieldError: {
    borderColor: '#EF9A9A',
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  fieldText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
  // ── Read-only info card ──────────────────────────────────────
  readOnlyCard: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    borderLeftWidth: 3,
    borderLeftColor: '#5CB35D',
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5CB35D',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  readOnlyText: {
    fontSize: 14,
  },
});
