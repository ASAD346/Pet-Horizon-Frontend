import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Switch, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/AppButton';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { FormSheetColors } from './formSheetStyles';
import { useAppThemeColor } from './useAppThemeColor';
import { useAppSelector } from '@/redux/store';
import { selectIsFormReadOnly } from '@/redux/reducer';


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
            <MaterialCommunityIcons name={icon} size={16} color={accentColor} />
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
  const isReadOnly = useAppSelector(selectIsFormReadOnly);

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
        editable={!isReadOnly}
        style={[
          styles.input,
          multiline ? styles.multilineInput : styles.standardHeight,
          focused && { borderColor: accentColor, borderWidth: 1.5 },
          error ? { borderColor: '#E53935' } : null,
          isReadOnly ? { backgroundColor: '#F3F4F6', color: '#9CA3AF' } : null,
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
  const isReadOnly = useAppSelector(selectIsFormReadOnly);

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
          styles.standardHeight,
          focused && { borderColor: accentColor, borderWidth: 1.5 },
          error ? { borderColor: '#E53935' } : null,
          isReadOnly ? { backgroundColor: '#F3F4F6' } : null,
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
          editable={!isReadOnly}
          style={[styles.flexInput, isReadOnly ? { color: '#9CA3AF' } : null]}
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
  const isReadOnly = useAppSelector(selectIsFormReadOnly);
  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <TouchableOpacity
        style={[styles.inputContainerRow, styles.standardHeight, isReadOnly ? { backgroundColor: '#F3F4F6' } : null]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isReadOnly}
      >
        <Ionicons name="calendar-outline" size={17} color={FormSheetColors.label} style={styles.leftIcon} />
        <AppText variant="bodySmall" weight="600" color={isReadOnly ? '#9CA3AF' : FormSheetColors.text} style={styles.pickerText}>
          {value.toLocaleDateString()}
        </AppText>
        <Ionicons name="chevron-down" size={15} color={FormSheetColors.placeholder} />
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
  const isReadOnly = useAppSelector(selectIsFormReadOnly);
  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <TouchableOpacity
        style={[styles.inputContainerRow, styles.standardHeight, isReadOnly ? { backgroundColor: '#F3F4F6' } : null]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isReadOnly}
      >
        <Ionicons name="time-outline" size={17} color={FormSheetColors.label} style={styles.leftIcon} />
        <AppText variant="bodySmall" weight="600" color={isReadOnly ? '#9CA3AF' : FormSheetColors.text} style={styles.pickerText}>
          {formattedTime}
        </AppText>
        <Ionicons name="chevron-down" size={15} color={FormSheetColors.placeholder} />
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
  const isReadOnly = useAppSelector(selectIsFormReadOnly);
  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <TouchableOpacity
        style={[styles.inputContainerRow, styles.standardHeight, isReadOnly ? { backgroundColor: '#F3F4F6' } : null]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isReadOnly}
      >
        <AppText variant="bodySmall" weight="600" color={isReadOnly ? '#9CA3AF' : FormSheetColors.text} style={styles.pickerText}>
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
  const { accentColor } = useAppThemeColor();
  const isReadOnly = useAppSelector(selectIsFormReadOnly);
  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <AppText variant="caption" weight="700" color={FormSheetColors.label} style={styles.fieldLabel}>
          {label}
        </AppText>
      ) : null}
      <View style={[styles.segmentedContainer, isReadOnly ? { opacity: 0.65 } : null]}>
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.segmentButton,
                isSelected && styles.segmentButtonActive,
                isSelected && { borderColor: accentColor },
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.85}
              disabled={isReadOnly}
            >
              <AppText
                variant="caption"
                weight={isSelected ? '800' : '600'}
                color={isSelected ? accentColor : FormSheetColors.label}
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
  const isReadOnly = useAppSelector(selectIsFormReadOnly);
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        {icon ? <Ionicons name={icon} size={18} color={FormSheetColors.label} /> : null}
        <AppText variant="bodySmall" weight="600" color={isReadOnly ? '#9CA3AF' : FormSheetColors.text}>
          {label}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: accentColor }}
        thumbColor={HomeTheme.white}
        ios_backgroundColor="#E5E7EB"
        disabled={isReadOnly}
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
}: StickyActionFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.stickyFooter,
        { paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      <CustomButton
        title={saveLabel}
        onPress={onSave}
        isLoading={saving}
        disabled={saveDisabled || saving}
        style={styles.saveButtonCustom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    letterSpacing: 0.8,
  },
  sectionBody: {
    gap: 14,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 4,
  },
  fieldLabel: {
    letterSpacing: 0.4,
    marginBottom: 7,
  },
  input: {
    width: '100%',
    backgroundColor: FormSheetColors.inputBg,
    borderColor: FormSheetColors.inputBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: FormSheetColors.text,
  },
  standardHeight: {
    height: 44,
  },
  multilineInput: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FormSheetColors.inputBg,
    borderColor: FormSheetColors.inputBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  flexInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: FormSheetColors.text,
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
    backgroundColor: FormSheetColors.chipBg,
    borderRadius: 8,
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 10,
  },
  pickerText: {
    flex: 1,
  },
  rightIcon: {
    marginLeft: 8,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#ECEEF2',
    borderRadius: Radius.md,
    padding: 3,
    width: '100%',
  },
  segmentButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md - 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  segmentText: {
    fontSize: 13,
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
    paddingHorizontal: 14,
    height: 48,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF2',
    paddingHorizontal: 20,
    paddingTop: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  saveButtonCustom: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    shadowColor: '#114227',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  errorText: {
    marginTop: 4,
  },
});
