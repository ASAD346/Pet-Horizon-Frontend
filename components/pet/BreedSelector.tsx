import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

interface BreedSelectorProps {
  value: string;
  breeds: string[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (breed: string) => void;
}

const fieldShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  android: { elevation: 1 },
});

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
      <AppText variant="bodySmall" weight="700" color={LoginTheme.charcoal} style={styles.label}>
        Breed
      </AppText>

      <TouchableOpacity
        style={[styles.field, error ? styles.fieldError : null, disabled ? styles.fieldDisabled : null]}
        onPress={() => !disabled && !loading && breeds.length > 0 && setVisible(true)}
        activeOpacity={0.8}
        disabled={disabled || loading || breeds.length === 0}
      >
        <AppText
          variant="body"
          color={value ? LoginTheme.charcoal : LoginTheme.inputPlaceholder}
          weight="500"
          style={styles.fieldText}
          numberOfLines={1}
        >
          {displayValue}
        </AppText>
        {loading ? (
          <ActivityIndicator size="small" color={LoginTheme.green} />
        ) : (
          <Ionicons name="chevron-down" size={20} color={LoginTheme.green} />
        )}
      </TouchableOpacity>

      {error ? (
        <AppText variant="caption" color="#C62828" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <AppText variant="h3" weight="700" color={LoginTheme.charcoal}>
                Select breed
              </AppText>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={LoginTheme.charcoal} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={breeds}
              keyExtractor={(item) => item}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
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
                      color={selected ? LoginTheme.footerText : LoginTheme.charcoal}
                      weight={selected ? '700' : '500'}
                    >
                      {item}
                    </AppText>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color={LoginTheme.footerText} />
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
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  field: {
    height: 42,
    backgroundColor: LoginTheme.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...fieldShadow,
  },
  fieldError: {
    borderWidth: 1,
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
    marginLeft: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: LoginTheme.screenBg,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: '70%',
    paddingBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  optionSelected: {
    backgroundColor: LoginTheme.green,
  },
});
