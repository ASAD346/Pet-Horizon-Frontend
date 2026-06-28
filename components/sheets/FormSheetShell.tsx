import React, { createContext, useState, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeModal } from '@/components/ui/SafeModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Spacing } from '@/constants/theme';
import { FormSheetHero } from './FormSheetHero';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';
import { useAppThemeColor } from './useAppThemeColor';
import { StickyActionFooter } from './FormSystem';
import { ToastHost } from '@/components/ui/ToastHost';

export const SheetOverlayContext = createContext<{
  setOverlay: (key: string, node: ReactNode) => void;
  removeOverlay: (key: string) => void;
} | null>(null);

interface FormSheetShellProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor?: string;
  accentBg?: string;
  saveLabel?: string;
  onSave?: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  compact?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export function FormSheetShell({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  accentColor: _accentColor,
  accentBg: _accentBg,
  saveLabel,
  onSave,
  saving,
  saveDisabled,
  compact = false,
  error,
  children,
}: FormSheetShellProps) {
  const insets = useSafeAreaInsets();
  const { accentColor, accentBg, gradientColors } = useAppThemeColor();
  const [overlays, setOverlays] = useState<Record<string, ReactNode>>({});

  const contextValue = React.useMemo(() => ({
    setOverlay: (key: string, node: ReactNode) => setOverlays(prev => ({ ...prev, [key]: node })),
    removeOverlay: (key: string) => setOverlays(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    })
  }), []);

  return (
    <SafeModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SheetOverlayContext.Provider value={contextValue}>
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
              contentContainerStyle={[
                formSheetStyles.scrollContent,
                { paddingBottom: 100 } // Ensure last field is visible above sticky footer
              ]}
            >
              {!compact && subtitle ? (
                <FormSheetHero
                  icon={icon}
                  accentColor={accentColor}
                  accentBg={accentBg}
                  subtitle={subtitle}
                />
              ) : null}

              {children}

              {error ? (
                <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                  <AppText variant="bodySmall" weight="700" color="#E53935">
                    {error}
                  </AppText>
                </View>
              ) : null}
            </ScrollView>

            {onSave && saveLabel ? (
              <StickyActionFooter
                onSave={onSave}
                saveLabel={saveLabel}
                saving={saving}
                saveDisabled={saveDisabled}
                accentColor={accentColor}
              />
            ) : null}

            {Object.values(overlays)}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
      <ToastHost />
      </SheetOverlayContext.Provider>
    </SafeModal>
  );
}
