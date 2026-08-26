import React, { createContext, useState, useEffect, ReactNode } from 'react';
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
import { CustomButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Spacing } from '@/constants/theme';
import { FormSheetHero } from './FormSheetHero';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';
import { useAppThemeColor } from './useAppThemeColor';
import { StickyActionFooter } from './FormSystem';

import { useAppDispatch } from '@/redux/store';
import { setFormReadOnlyAction } from '@/redux/action';

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
  isReadOnly?: boolean;
  blockIfReadOnly?: boolean;
  isLoading?: boolean;
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
  isReadOnly = false,
  blockIfReadOnly = true,
  isLoading = false,
  children,
}: FormSheetShellProps) {
  const insets = useSafeAreaInsets();
  const { accentColor, accentBg, gradientColors } = useAppThemeColor();
  const [overlays, setOverlays] = useState<Record<string, ReactNode>>({});
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (visible && !isLoading) {
      dispatch(setFormReadOnlyAction(isReadOnly));
    }
    return () => {
      dispatch(setFormReadOnlyAction(false));
    };
  }, [visible, isReadOnly, isLoading, dispatch]);

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
              <View style={formSheetStyles.handle} />
 
              <View style={formSheetStyles.headerContent}>
                <View style={formSheetStyles.headerLeft}>
                  <View style={formSheetStyles.headerIconBadge}>
                    <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
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
                <Pressable style={formSheetStyles.closeButton} onPress={onClose} hitSlop={12}>
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.9)" />
                </Pressable>
              </View>
            </LinearGradient>
 
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                formSheetStyles.scrollContent,
                { paddingBottom: isReadOnly ? 10 : 110 } // Reduce padding when read-only to eliminate space below Close button
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

              {isReadOnly && blockIfReadOnly && !isLoading ? (
                <View style={{ paddingVertical: 20, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <MaterialCommunityIcons name="lock" size={32} color="#DC2626" />
                  </View>
                  <AppText variant="h3" weight="800" color="#1E293B" style={{ marginBottom: 8, textAlign: 'center' }}>
                    Access Restricted
                  </AppText>
                  <AppText variant="bodySmall" color="#64748B" style={{ textAlign: 'center', lineHeight: 18, marginBottom: 24 }}>
                    {"You don't have permission to edit or create this schedule. Please request access from an admin."}
                  </AppText>
                  
                  <View style={{ width: '100%', marginBottom: 10 }}>
                    <CustomButton
                      title="Close"
                      onPress={onClose}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <View pointerEvents="auto">
                    {children}
                  </View>

                  {error ? (
                    <View style={{ paddingHorizontal: 4, marginTop: 12 }}>
                      <AppText variant="bodySmall" weight="700" color="#E53935">
                        {error}
                      </AppText>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>

            {onSave && saveLabel && !isReadOnly ? (
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
      </SheetOverlayContext.Provider>
    </SafeModal>
  );
}
