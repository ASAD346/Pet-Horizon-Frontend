import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import {
  removeFamilyMember,
  revokeFamilyPetAccess,
  updateFamilyMemberPermissions,
} from '@/services/family/familyHubApi';
import type { FamilyHubMemberRow } from '@/types/family';
import type { ApiPet } from '@/types/pet';

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

interface FamilyHubMemberSheetProps {
  visible: boolean;
  member: FamilyHubMemberRow | null;
  familyId: string | null;
  familyPets: ApiPet[];
  token: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function FamilyHubMemberSheet({
  visible,
  member,
  familyId,
  familyPets,
  token,
  onClose,
  onUpdated,
}: FamilyHubMemberSheetProps) {
  const insets = useSafeAreaInsets();
  const [accessLevel, setAccessLevel] = useState<'readonly' | 'edit'>('readonly');
  const [modules, setModules] = useState<string[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberName =
    member?.userId.fullName?.trim() || member?.userId.email?.split('@')[0] || 'Member';
  const isAdminMember = member?.role === 'admin';

  useEffect(() => {
    if (visible && member) {
      setAccessLevel('readonly');
      setModules(['feeding', 'walks', 'medicine']);
      setSelectedPetId(familyPets[0]?._id ?? null);
      setError(null);
    }
  }, [visible, member, familyPets]);

  const toggleModule = (moduleId: string) => {
    setModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId],
    );
  };

  const handleSave = async () => {
    if (!token || !familyId || !member || !selectedPetId || isAdminMember) return;
    setSaving(true);
    setError(null);
    try {
      await updateFamilyMemberPermissions(token, familyId, member.userId._id, {
        permissions: [
          {
            petId: selectedPetId,
            accessLevel,
            allowedModules: modules,
          },
        ],
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRevokePet = () => {
    if (!token || !familyId || !member || !selectedPetId || isAdminMember) return;
    const petName = familyPets.find((pet) => pet._id === selectedPetId)?.name ?? 'pet';
    Alert.alert('Revoke access', `Remove ${memberName}'s access to ${petName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setError(null);
          try {
            await revokeFamilyPetAccess(token, familyId, member.userId._id, selectedPetId);
            onUpdated();
            onClose();
          } catch (err) {
            setError(getErrorMessage(err));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleRemove = () => {
    if (!token || !familyId || !member || isAdminMember) return;
    Alert.alert('Remove member', `Remove ${memberName} from the family hub?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemoving(true);
          setError(null);
          try {
            await removeFamilyMember(token, familyId, member.userId._id);
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={SheetColors.title}>
              Hub Member
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={HomeTheme.text} />
            </TouchableOpacity>
          </View>

          <AppText variant="body" weight="700" color={HomeTheme.text} style={styles.memberName}>
            {memberName}
          </AppText>
          {member?.userId.email ? (
            <AppText variant="caption" color={HomeTheme.textMuted} style={styles.email}>
              {member.userId.email}
            </AppText>
          ) : null}

          {error ? <AuthErrorBanner message={error} /> : null}

          {isAdminMember ? (
            <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.adminNote}>
              Admins have full access. Permissions cannot be changed here.
            </AppText>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <SectionLabel text="PET ACCESS" />
              {familyPets.length === 0 ? (
                <AppText variant="bodySmall" color={HomeTheme.textMuted}>
                  No family pets available.
                </AppText>
              ) : (
                <View style={styles.chipRow}>
                  {familyPets.map((pet) => {
                    const active = selectedPetId === pet._id;
                    return (
                      <TouchableOpacity
                        key={pet._id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setSelectedPetId(pet._id)}
                      >
                        <AppText
                          variant="bodySmall"
                          weight="600"
                          color={active ? HomeTheme.white : HomeTheme.textMuted}
                        >
                          {pet.name}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <SectionLabel text="ACCESS LEVEL" />
              <View style={styles.chipRow}>
                {ACCESS_LEVELS.map((level) => {
                  const active = accessLevel === level.id;
                  return (
                    <TouchableOpacity
                      key={level.id}
                      style={[styles.chip, active && styles.chipActive]}
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
                      style={[styles.chip, active && styles.chipActive]}
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
          )}

          {!isAdminMember ? (
            <>
              <AppButton
                title="Save Permissions"
                onPress={handleSave}
                loading={saving}
                disabled={removing || !selectedPetId}
                variant="success"
                size="md"
                style={styles.saveBtn}
              />
              <AppButton
                title="Revoke Pet Access"
                onPress={handleRevokePet}
                disabled={saving || removing || !selectedPetId}
                variant="outline"
                size="md"
                style={styles.outlineBtn}
                textStyle={styles.warnText}
              />
              <AppButton
                title="Remove from Family"
                onPress={handleRemove}
                loading={removing}
                disabled={saving}
                variant="outline"
                size="md"
                style={styles.outlineBtn}
                textStyle={styles.removeText}
              />
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  memberName: {
    marginBottom: 2,
  },
  email: {
    marginBottom: Spacing.md,
  },
  adminNote: {
    marginBottom: Spacing.md,
    lineHeight: 18,
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
  chipActive: {
    backgroundColor: HomeTheme.cardGreen,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  outlineBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  warnText: {
    color: '#E65100',
  },
  removeText: {
    color: '#E53935',
  },
});
