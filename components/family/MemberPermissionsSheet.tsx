import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { removePetMember, updatePetMemberPermissions } from '@/services/family/familyApi';
import type { PetMemberRow } from '@/types/family';

const MODULE_OPTIONS = [
  { id: 'feeding', label: 'Feeding' },
  { id: 'walks', label: 'Walks' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'grooming', label: 'Grooming' },
  { id: 'vaccination', label: 'Vaccination' },
  { id: 'journal', label: 'Journal' },
  { id: 'expenses', label: 'Expenses' },
] as const;

const ACCESS_LEVELS = [
  { id: 'readonly', label: 'View only' },
  { id: 'edit', label: 'Can edit' },
] as const;

interface MemberPermissionsSheetProps {
  visible: boolean;
  member: PetMemberRow | null;
  petId: string | null;
  token: string | null;
  isPremium?: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function MemberPermissionsSheet({
  visible,
  member,
  petId,
  token,
  isPremium = false,
  onClose,
  onUpdated,
}: MemberPermissionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [accessLevel, setAccessLevel] = useState<'readonly' | 'edit'>('readonly');
  const [modules, setModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberName =
    member?.userId.fullName?.trim() || member?.userId.email?.split('@')[0] || 'Member';

  useEffect(() => {
    if (visible && member) {
      setAccessLevel(member.accessLevel === 'edit' ? 'edit' : 'readonly');
      setModules(member.allowedModules ?? []);
      setError(null);
    }
  }, [visible, member]);

  const toggleModule = (moduleId: string) => {
    setModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId],
    );
  };

  const handleSave = async () => {
    if (!token || !petId || !member) return;
    setSaving(true);
    setError(null);
    try {
      await updatePetMemberPermissions(token, petId, member.userId._id, {
        accessLevel,
        allowedModules: modules,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (!token || !petId || !member) return;
    Alert.alert('Remove member', `Remove ${memberName} from this pet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemoving(true);
          setError(null);
          try {
            await removePetMember(token, petId, member.userId._id);
            onUpdated();
            onClose();
          } catch (err) {
            setError(getErrorMessage(err));
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  };

  const headerColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const activeGreen = isPremium ? '#184F2E' : '#3A8F3B';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Pressable style={styles.overlayInner} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            onPress={() => {}}
          >
            <LinearGradient
              colors={headerColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
              <View style={styles.handle} />
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIconBadge}>
                    <Ionicons name="person-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <AppText variant="h3" weight="800" color="#FFFFFF" style={styles.headerTitle}>
                      Member Settings
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.75)" numberOfLines={1}>
                      Manage permissions for {memberName}
                    </AppText>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {error ? (
              <View style={styles.errorWrapper}>
                <AuthErrorBanner message={error} />
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <SectionLabel text="ACCESS LEVEL" />
              <View style={styles.chipRow}>
                {ACCESS_LEVELS.map((level) => {
                  const active = accessLevel === level.id;
                  return (
                    <TouchableOpacity
                      key={level.id}
                      style={[styles.chip, active && [styles.chipActive, { backgroundColor: activeGreen }]]}
                      onPress={() => setAccessLevel(level.id)}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="600"
                        color={active ? HomeTheme.white : HomeTheme.textMuted}
                      >
                        {level.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <SectionLabel text="ALLOWED MODULES" />
              <View style={styles.chipRow}>
                {MODULE_OPTIONS.map((module) => {
                  const active = modules.includes(module.id);
                  return (
                    <TouchableOpacity
                      key={module.id}
                      style={[styles.chip, active && [styles.chipActive, { backgroundColor: activeGreen }]]}
                      onPress={() => toggleModule(module.id)}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="600"
                        color={active ? HomeTheme.white : HomeTheme.textMuted}
                      >
                        {module.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.buttonWrapper}>
              <AppButton
                title="Save Permissions"
                onPress={handleSave}
                loading={saving}
                disabled={removing}
                variant="success"
                size="md"
                style={[styles.saveBtn, { backgroundColor: activeGreen }]}
              />
              <AppButton
                title="Remove Member"
                onPress={handleRemove}
                loading={removing}
                disabled={saving}
                variant="outline"
                size="md"
                style={styles.removeBtn}
                textStyle={styles.removeText}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayInner: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 15, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAFFFE',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 0,
    maxHeight: '94%',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  gradientHeader: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrapper: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: SheetColors.chipBg,
  },
  chipActive: {},
  buttonWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  removeBtn: {
    width: '100%',
    borderRadius: Radius.full,
    borderColor: '#E53935',
    marginBottom: Spacing.sm,
  },
  removeText: {
    color: '#E53935',
  },
});
