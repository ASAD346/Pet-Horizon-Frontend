import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Switch, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { FormSheetColors } from './formSheetStyles';
import { useAppThemeColor } from './useAppThemeColor';

interface BaseInputProps {
  label?: string;
  error?: string;
}

// 1. FormSection
interface FormSectionProps {
  title: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  children: React.ReactNode;
}

export function FormSection({ title, icon, children }: FormSectionProps) {
  const { accentColor, accentBg } = useAppThemeColor();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <View style={[styles.sectionIcon, { backgroundColor: accentBg }]}>
            <MaterialCommunityIcons name={icon} size={18} color={accentColor} />
          </View>
        ) : null}
        <AppText variant="caption" weight="800" color={FormSheetColors.label} style={styles.sectionTitle}>
          {title.toUpperCase()}
        </AppText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// 2. FormTextInput
interface FormTextInputProps extends BaseInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
}

export function FormTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
  keyboardType = 'default',
  error,
}: FormTextInputProps) {
  const { accentColor } = useAppThemeColor();
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={FormSheetColors.placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline ? styles.multilineInput : styles.standardHeight,
          focused && { borderColor: accentColor },
          error ? { borderColor: '#E53935' } : null,
        ]}
      />
      {error ? (
        <AppText variant="caption" color="#E53935" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// 3. FormNumberInput
interface FormNumberInputProps extends BaseInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  unit?: string; // Integrated inline unit
}

export function FormNumberInput({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  error,
}: FormNumberInputProps) {
  const { accentColor } = useAppThemeColor();
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.inputContainerRow,
          focused && { borderColor: accentColor },
          error ? { borderColor: '#E53935' } : null,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={FormSheetColors.placeholder}
          keyboardType="decimal-pad"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.flexInput}
        />
        {unit ? (
          <View style={styles.unitBadge}>
            <AppText variant="caption" weight="800" color={FormSheetColors.label}>
              {unit}
            </AppText>
          </View>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="#E53935" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// 4. FormDateInput
interface FormDateInputProps extends BaseInputProps {
  value: Date;
  onPress: () => void;
}

export function FormDateInput({ label, value, onPress, error }: FormDateInputProps) {
  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <TouchableOpacity
        style={[styles.inputContainerRow, styles.standardHeight]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <AppText variant="bodySmall" weight="600" color={FormSheetColors.text} style={styles.pickerText}>
          {value.toLocaleDateString()}
        </AppText>
        <Ionicons name="calendar-outline" size={16} color={FormSheetColors.label} style={styles.rightIcon} />
      </TouchableOpacity>
      {error ? (
        <AppText variant="caption" color="#E53935" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// 5. FormTimeInput
interface FormTimeInputProps extends BaseInputProps {
  value: Date;
  onPress: () => void;
}

export function FormTimeInput({ label, value, onPress, error }: FormTimeInputProps) {
  const formattedTime = value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <TouchableOpacity
        style={[styles.inputContainerRow, styles.standardHeight]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <AppText variant="bodySmall" weight="600" color={FormSheetColors.text} style={styles.pickerText}>
          {formattedTime}
        </AppText>
        <Ionicons name="time-outline" size={16} color={FormSheetColors.label} style={styles.rightIcon} />
      </TouchableOpacity>
      {error ? (
        <AppText variant="caption" color="#E53935" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// 6. FormSelectInput
interface FormSelectInputProps extends BaseInputProps {
  valueLabel: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function FormSelectInput({ label, valueLabel, onPress, icon = 'chevron-down', error }: FormSelectInputProps) {
  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <TouchableOpacity
        style={[styles.inputContainerRow, styles.standardHeight]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <AppText variant="bodySmall" weight="600" color={FormSheetColors.text} style={styles.pickerText}>
          {valueLabel}
        </AppText>
        <Ionicons name={icon} size={16} color={FormSheetColors.label} style={styles.rightIcon} />
      </TouchableOpacity>
      {error ? (
        <AppText variant="caption" color="#E53935" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// 7. FormSegmentedControl
interface FormSegmentedControlProps extends BaseInputProps {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

export function FormSegmentedControl({
  label,
  options,
  selected,
  onSelect,
  error,
}: FormSegmentedControlProps) {
  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.segmentedContainer}>
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.9}
            >
              <AppText
                variant="caption"
                weight="700"
                color={isSelected ? FormSheetColors.text : FormSheetColors.label}
                style={styles.segmentText}
              >
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? (
        <AppText variant="caption" color="#E53935" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// 8. FormToggleRow
interface FormToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function FormToggleRow({ label, value, onValueChange, icon }: FormToggleRowProps) {
  const { accentColor } = useAppThemeColor();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        {icon ? <Ionicons name={icon} size={18} color={FormSheetColors.label} /> : null}
        <AppText variant="bodySmall" weight="600" color={FormSheetColors.text}>
          {label}
        </AppText>
      </View>
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

// 9. StickyActionFooter
interface StickyActionFooterProps {
  onSave: () => void;
  saveLabel: string;
  saving?: boolean;
  saveDisabled?: boolean;
  accentColor?: string;
}

export function StickyActionFooter({
  onSave,
  saveLabel,
  saving = false,
  saveDisabled = false,
  accentColor,
}: StickyActionFooterProps) {
  const insets = useSafeAreaInsets();
  const { accentColor: finalAccentColor } = useAppThemeColor();
  const color = accentColor || finalAccentColor;

  return (
    <View
      style={[
        styles.stickyFooter,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: color },
          (saveDisabled || saving) && styles.disabledButton,
        ]}
        onPress={onSave}
        disabled={saveDisabled || saving}
        activeOpacity={0.8}
      >
        <AppText variant="bodySmall" weight="800" color="#FFFFFF">
          {saveLabel}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    letterSpacing: 0.8,
  },
  sectionBody: {
    gap: 12,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 4,
  },
  fieldLabel: {
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: FormSheetColors.inputBg,
    borderColor: FormSheetColors.inputBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: FormSheetColors.text,
  },
  standardHeight: {
    height: 40,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 10,
    paddingBottom: 10,
  },
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FormSheetColors.inputBg,
    borderColor: FormSheetColors.inputBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  flexInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: FormSheetColors.text,
  },
  unitBadge: {
    paddingLeft: 8,
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: FormSheetColors.inputBorder,
    justifyContent: 'center',
    height: '100%',
  },
  pickerText: {
    flex: 1,
  },
  rightIcon: {
    marginLeft: 8,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E6E8EB',
    borderRadius: Radius.md,
    padding: 2,
    width: '100%',
  },
  segmentButton: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md - 2,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentText: {
    fontSize: 12,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FormSheetColors.inputBg,
    borderColor: FormSheetColors.inputBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButton: {
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    marginTop: 4,
  },
});
