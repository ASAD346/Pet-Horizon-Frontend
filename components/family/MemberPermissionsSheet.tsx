import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CustomButton } from '@/components/ui/AppButton';
import {
  FormSheetShell,
  FormSection,
  FormSegmentedControl,
  FormToggleRow,
} from '@/components/sheets';
import { getErrorMessage } from '@/lib/api/errors';
import { removePetMember, updatePetMemberPermissions } from '@/services/family/familyApi';
import { useToast } from '@/hooks/useToast';
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
  onUpdated: (updatedOrDeletedMember: string | PetMemberRow) => void;
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
  const [accessLevel, setAccessLevel] = useState<'readonly' | 'edit'>('readonly');
  const [modules, setModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccessToast, showErrorToast } = useToast();

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
      showSuccessToast("Member permissions updated successfully.");
      onUpdated({
        ...member,
        accessLevel,
        allowedModules: modules,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!token || !petId || !member) return;
    setRemoving(true);
    setError(null);
    try {
      await removePetMember(token, petId, member.userId._id);
      showSuccessToast("Member removed from Family Hub successfully.");
      onUpdated(member.userId._id);
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || getErrorMessage(err) || "Failed to remove the member. Please try again.";
      setError(errMsg);
      showErrorToast(errMsg);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title="Member Settings"
      subtitle={`Manage permissions for ${memberName}`}
      icon="account"
      saveLabel="Save Permissions"
      onSave={handleSave}
      saving={saving}
      saveDisabled={removing}
      error={error}
      compact
    >
      <FormSection title="Access Scope">
        <FormSegmentedControl
          label="Access Level"
          options={ACCESS_LEVELS.map((o) => ({ value: o.id, label: o.label }))}
          selected={accessLevel}
          onSelect={(val) => setAccessLevel(val as 'readonly' | 'edit')}
        />
      </FormSection>

      <FormSection title="Allowed Modules">
        {MODULE_OPTIONS.map((module) => {
          const isEnabled = modules.includes(module.id);
          return (
            <FormToggleRow
              key={module.id}
              label={module.label}
              value={isEnabled}
              onValueChange={() => toggleModule(module.id)}
            />
          );
        })}
      </FormSection>

      <View style={styles.removeSection}>
        <CustomButton
          title="Remove Member from Family"
          onPress={handleRemove}
          isLoading={removing}
          disabled={saving}
          variant="outline"
          style={styles.removeBtn}
          textStyle={styles.removeText}
        />
      </View>
    </FormSheetShell>
  );
}

const styles = StyleSheet.create({
  removeSection: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  removeBtn: {
    width: '100%',
    borderColor: '#E53935',
    borderWidth: 1.5,
  },
  removeText: {
    color: '#E53935',
    fontWeight: '700',
  },
});
