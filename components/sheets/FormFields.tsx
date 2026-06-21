import React from 'react';
import { View, TouchableOpacity, TextInput, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme } from '@/constants/theme';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';

export function FormSectionLabel({ text }: { text: string }) {
  return (
    <AppText
      variant="caption"
      weight="700"
      color={FormSheetColors.label}
      style={styles.sectionLabel}
    >
      {text}
    </AppText>
  );
}

interface FormChipRowProps {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  accentColor: string;
}

export function FormChipRow({ options, selected, onSelect, accentColor }: FormChipRowProps) {
  return (
    <View style={[formSheetStyles.chipRow, formSheetStyles.fieldGap]}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              formSheetStyles.chip,
              isSelected && [
                formSheetStyles.chipSelected,
                { backgroundColor: accentColor, borderColor: accentColor },
              ],
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.85}
          >
            {isSelected ? <Ionicons name="checkmark-circle" size={16} color={HomeTheme.white} /> : null}
            <AppText variant="caption" weight="700" color={isSelected ? HomeTheme.white : FormSheetColors.text}>
              {option.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface FormMultiChipRowProps {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  accentColor: string;
}

export function FormMultiChipRow({ options, selected, onToggle, accentColor }: FormMultiChipRowProps) {
  return (
    <View style={[formSheetStyles.chipRow, formSheetStyles.fieldGap]}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              formSheetStyles.chip,
              isSelected && [
                formSheetStyles.chipSelected,
                { backgroundColor: accentColor, borderColor: accentColor },
              ],
            ]}
            onPress={() => onToggle(option.value)}
            activeOpacity={0.85}
          >
            <AppText variant="caption" weight="700" color={isSelected ? HomeTheme.white : FormSheetColors.text}>
              {option.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface FormTextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
}

export function FormTextField({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline,
}: FormTextFieldProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={FormSheetColors.placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[
        formSheetStyles.textInput,
        formSheetStyles.fieldGap,
        multiline ? formSheetStyles.notesInput : undefined,
      ]}
    />
  );
}

interface FormPickerFieldProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

export function FormPickerField({ label, icon, onPress }: FormPickerFieldProps) {
  return (
    <TouchableOpacity style={[formSheetStyles.pickerField, formSheetStyles.fieldGap]} onPress={onPress} activeOpacity={0.85}>
      <AppText variant="bodySmall" weight="600" color={FormSheetColors.text}>
        {label}
      </AppText>
      <Ionicons name={icon} size={18} color={FormSheetColors.label} />
    </TouchableOpacity>
  );
}

interface FormSwitchRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  accentColor: string;
}

export function FormSwitchRow({ label, value, onValueChange, accentColor }: FormSwitchRowProps) {
  return (
    <View style={[formSheetStyles.switchRow, formSheetStyles.fieldGap]}>
      <AppText variant="bodySmall" weight="600" color={FormSheetColors.text}>
        {label}
      </AppText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: accentColor }}
        thumbColor={HomeTheme.white}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

interface FormSuffixInputProps {
  value: string;
  onChangeText: (text: string) => void;
  suffix: string;
  keyboardType?: 'decimal-pad' | 'number-pad';
  placeholder?: string;
}

export function FormSuffixInput({
  value,
  onChangeText,
  suffix,
  keyboardType = 'decimal-pad',
  placeholder,
}: FormSuffixInputProps) {
  return (
    <View style={[formSheetStyles.suffixInputWrap, formSheetStyles.fieldGap]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={FormSheetColors.placeholder}
        style={formSheetStyles.suffixInput}
      />
      <AppText variant="caption" weight="700" color={FormSheetColors.label}>
        {suffix}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 0,
  },
});
