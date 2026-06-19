import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { HomeTheme, Spacing } from '@/constants/theme';
import { FormSheetHero } from './FormSheetHero';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';

interface FormSheetShellProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor: string;
  accentBg: string;
  saveLabel: string;
  onSave: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export function FormSheetShell({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  accentColor,
  accentBg,
  saveLabel,
  onSave,
  saving,
  saveDisabled,
  error,
  children,
}: FormSheetShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={formSheetStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Pressable style={formSheetStyles.overlay} onPress={onClose}>
          <Pressable
            style={[formSheetStyles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            onPress={() => {}}
          >
            <View style={formSheetStyles.handle} />

            <View style={formSheetStyles.topBar}>
              <AppText variant="h3" weight="800" color={FormSheetColors.text} style={{ flex: 1 }}>
                {title}
              </AppText>
              <Pressable style={formSheetStyles.closeBtn} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color={FormSheetColors.text} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={formSheetStyles.scrollContent}
            >
              <FormSheetHero
                icon={icon}
                accentColor={accentColor}
                accentBg={accentBg}
                subtitle={subtitle}
              />

              {error ? <AuthErrorBanner message={error} /> : null}

              {children}
            </ScrollView>

            <View style={formSheetStyles.footer}>
              <AppButton
                title={saveLabel}
                onPress={onSave}
                loading={saving}
                disabled={saving || saveDisabled}
                variant="success"
                size="md"
                style={[formSheetStyles.saveBtn, { backgroundColor: accentColor }]}
                textStyle={formSheetStyles.saveBtnText}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
