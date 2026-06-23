import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Skeleton } from '@/components/ui/skeletons';
import { Palette, Radius, Spacing } from '../../constants/theme';

interface BreedSelectorProps {
  value: string;
  breeds: string[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (breed: string) => void;
}

export function BreedSelector({
  value,
  breeds,
  loading = false,
  disabled = false,
  error,
  onChange,
}: BreedSelectorProps) {
  const [visible, setVisible] = useState(false);

  const placeholder = loading ? 'Loading breeds…' : breeds.length ? 'Select breed' : 'No breeds available';
  const displayValue = value || placeholder;

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

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <AppText variant="h3" weight="800" color="#1A2B4E">
                Select Breed
              </AppText>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color="#1A2B4E" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={breeds}
              keyExtractor={(item) => item}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onChange(item);
                      setVisible(false);
                    }}
                  >
                    <AppText
                      variant="body"
                      color={selected ? '#5CB35D' : Palette.gray[800]}
                      weight={selected ? '700' : '600'}
                    >
                      {item}
                    </AppText>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color="#5CB35D" />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF9F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
  },
  optionSelected: {
    backgroundColor: 'rgba(92, 179, 93, 0.08)',
  },
});
