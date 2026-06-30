import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CustomButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
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
  isReadOnly?: boolean;
  onClose: () => void;
  onUpdated: (updatedOrDeletedMember: string | PetMemberRow) => void;
}

export function MemberPermissionsSheet({
  visible,
  member,
  petId,
  token,
  isPremium = false,
  isReadOnly = false,
  onClose,
  onUpdated,
}: MemberPermissionsSheetProps) {
  const [accessLevel, setAccessLevel] = useState<'readonly' | 'edit'>('readonly');
  const [feeding, setFeeding] = useState(false);
  const [walks, setWalks] = useState(false);
  const [medicine, setMedicine] = useState(false);
  const [grooming, setGrooming] = useState(false);
  const [vaccination, setVaccination] = useState(false);
  const [journal, setJournal] = useState(false);
  const [expenses, setExpenses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccessToast, showErrorToast } = useToast();

  const memberName =
    member?.userId.fullName?.trim() || member?.userId.email?.split('@')[0] || 'Member';

  useEffect(() => {
    if (visible && member) {
      setAccessLevel(member.accessLevel === 'edit' ? 'edit' : 'readonly');
      if (member.permissions) {
        setFeeding(!!member.permissions.feeding);
        setWalks(!!member.permissions.walks);
        setMedicine(!!member.permissions.medicine);
        setGrooming(!!member.permissions.grooming);
        setVaccination(!!member.permissions.vaccination);
        setJournal(!!member.permissions.journal);
        setExpenses(!!member.permissions.expenses);
      } else {
        const allowed = member.allowedModules ?? [];
        setFeeding(allowed.includes('feeding'));
        setWalks(allowed.includes('walks'));
        setMedicine(allowed.includes('medicine'));
        setGrooming(allowed.includes('grooming'));
        setVaccination(allowed.includes('vaccination'));
        setJournal(allowed.includes('journal'));
        setExpenses(allowed.includes('expenses'));
      }
      setError(null);
    }
  }, [visible, member, member?.permissions]);

  const getPermissionValue = (moduleId: string) => {
    if (isReadOnly && member) {
      if (member.permissions) {
        return !!(member.permissions as any)[moduleId];
      }
      const allowed = member.allowedModules ?? [];
      return allowed.includes(moduleId);
    }
    switch (moduleId) {
      case 'feeding': return feeding;
      case 'walks': return walks;
      case 'medicine': return medicine;
      case 'grooming': return grooming;
      case 'vaccination': return vaccination;
      case 'journal': return journal;
      case 'expenses': return expenses;
      default: return false;
    }
  };

  const togglePermissionValue = (moduleId: string) => {
    switch (moduleId) {
      case 'feeding': setFeeding(!feeding); break;
      case 'walks': setWalks(!walks); break;
      case 'medicine': setMedicine(!medicine); break;
      case 'grooming': setGrooming(!grooming); break;
      case 'vaccination': setVaccination(!vaccination); break;
      case 'journal': setJournal(!journal); break;
      case 'expenses': setExpenses(!expenses); break;
    }
  };

  const handleSave = async () => {
    if (!token || !petId || !member) return;
    setSaving(true);
    setError(null);
    try {
      const updatedPermissions = {
        feeding,
        walks,
        medicine,
        grooming,
        vaccination,
        journal,
        expenses,
      };
      const allowedModules = Object.keys(updatedPermissions).filter(
        (key) => updatedPermissions[key as keyof typeof updatedPermissions],
      );

      const res = await updatePetMemberPermissions(token, petId, member.userId._id, {
        accessLevel,
        allowedModules,
        permissions: updatedPermissions,
      } as any);

      showSuccessToast("Member permissions updated successfully.");
      onUpdated({
        ...member,
        accessLevel,
        allowedModules,
        permissions: res.member?.permissions || updatedPermissions,
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
      subtitle={isReadOnly ? `Viewing permissions for ${memberName}` : `Manage permissions for ${memberName}`}
      icon="account"
      saveLabel={isReadOnly ? undefined : "Save Permissions"}
      onSave={isReadOnly ? undefined : handleSave}
      saving={saving}
      saveDisabled={removing}
      error={error}
      isReadOnly={isReadOnly}
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
          const isEnabled = getPermissionValue(module.id);
          return (
            <FormToggleRow
              key={module.id}
              label={module.label}
              value={isEnabled}
              onValueChange={() => togglePermissionValue(module.id)}
            />
          );
        })}
      </FormSection>

      {!isReadOnly ? (
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
      ) : (
        <View style={{ paddingHorizontal: 4, marginTop: 24, alignItems: 'center' }}>
          <AppText variant="bodySmall" weight="700" color="#64748B">
            Viewing assigned workspace permissions.
          </AppText>
        </View>
      )}
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
