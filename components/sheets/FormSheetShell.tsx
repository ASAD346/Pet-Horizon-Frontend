import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { HomeTheme, Spacing } from '@/constants/theme';
import { FormSheetHero } from './FormSheetHero';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';
import { useAuth } from '@/hooks/useAuth';

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
  compact?: boolean;
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
  compact = false,
  children,
}: FormSheetShellProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';

  // Cohesive brand gradients
  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const activeGreen = isPremium ? '#184F2E' : '#3A8F3B';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={formSheetStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Pressable style={formSheetStyles.overlay} onPress={onClose}>
          <Pressable
            style={[formSheetStyles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            onPress={() => {}}
          >
            {/* Curved linear gradient header */}
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={formSheetStyles.gradientHeader}
            >
              {/* Drag handle inside the header */}
              <View style={[formSheetStyles.handle, { backgroundColor: 'rgba(255, 255, 255, 0.45)' }]} />

              <View style={formSheetStyles.headerContent}>
                <View style={formSheetStyles.headerLeft}>
                  <View style={formSheetStyles.headerIconBadge}>
                    <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="h3" weight="800" color="#FFFFFF" style={formSheetStyles.headerTitle}>
                      {title}
                    </AppText>
                    {subtitle ? (
                      <AppText variant="caption" color="rgba(255,255,255,0.75)" numberOfLines={1}>
                        {subtitle}
                      </AppText>
                    ) : null}
                  </View>
                </View>
                <Pressable style={formSheetStyles.closeButton} onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
                </Pressable>
              </View>
            </LinearGradient>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={formSheetStyles.scrollContent}
            >
              {!compact && subtitle ? (
                <FormSheetHero
                  icon={icon}
                  accentColor={accentColor}
                  accentBg={accentBg}
                  subtitle={subtitle}
                />
              ) : null}

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
                style={[formSheetStyles.saveBtn, { backgroundColor: activeGreen }]}
                textStyle={formSheetStyles.saveBtnText}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
