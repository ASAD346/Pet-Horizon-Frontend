import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { updateMemberPermissionsSuccess } from '@/redux/action';
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
import { usePetMembers } from '@/hooks/usePetMembers';
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
  console.log('DEBUG_MEMBER_PERMISSIONS:', {
    incomingMemberProp: member,
    resolvedPermissions: member?.permissions,
    legacyModules: member?.allowedModules
  });

  const queryClient = useQueryClient();
  const dispatch = useDispatch();

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
  
  const { members: membersList } = usePetMembers(token, petId, !isReadOnly);

  const targetUserId = member?.userId?._id || (member as any)?.id || (member as any)?._id || '';

  const activeCachedMember = membersList?.find(
    (m) => String(m.userId?._id || (m as any).id || (m as any)._id) === String(targetUserId)
  );

  const memberName =
    member?.userId?.fullName || (member as any)?.fullName || (member as any)?.name || "Care Member";

  useEffect(() => {
    const targetRecord = activeCachedMember || member;
    if (visible && targetRecord) {
      setAccessLevel(targetRecord.accessLevel === 'edit' ? 'edit' : 'readonly');
      
      const currentPerms = targetRecord.permissions || {};
      const allowed = targetRecord.allowedModules ?? [];

      const getCheck = (key: string) => {
        if ((currentPerms as any)[key] !== undefined) return !!(currentPerms as any)[key];
        if ((targetRecord as any)[key] !== undefined) return !!(targetRecord as any)[key];
        const targetMatch = key.charAt(0).toUpperCase() + key.slice(1);
        return !!(allowed.includes(key) || allowed.includes(targetMatch));
      };

      setFeeding(getCheck('feeding'));
      setWalks(getCheck('walks'));
      setMedicine(getCheck('medicine'));
      setGrooming(getCheck('grooming'));
      setVaccination(getCheck('vaccination'));
      setJournal(getCheck('journal'));
      setExpenses(getCheck('expenses'));
      setError(null);
    }
  }, [member, visible, activeCachedMember]);

  const getLivePermission = (key: string) => {
    const targetRecord = activeCachedMember || member;
    if (!targetRecord) return false;

    // 1. Direct extraction path from core permissions layer
    if (targetRecord.permissions && typeof (targetRecord.permissions as any)[key] !== 'undefined') {
      return Boolean((targetRecord.permissions as any)[key]);
    }
    
    // 2. Fallback lookup: Check if it's nested directly under member object properties
    if (typeof (targetRecord as any)[key] !== 'undefined') {
      return Boolean((targetRecord as any)[key]);
    }

    // 3. Array Fallback lookup (Case Insensitive / Standard Match)
    const modulesArray = targetRecord.allowedModules || (targetRecord.userId as any)?.allowedModules;
    if (Array.isArray(modulesArray)) {
      const targetMatch = key.charAt(0).toUpperCase() + key.slice(1); // e.g., 'feeding' -> 'Feeding'
      return modulesArray.includes(key) || modulesArray.includes(targetMatch);
    }

    return false; // Safe lock boundary
  };

  const getPermissionValue = (moduleId: string) => {
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
      const updatedPermissionsObj = {
        feeding,
        walks,
        medicine,
        grooming,
        vaccination,
        journal,
        expenses,
      };
      const allowedModules = Object.keys(updatedPermissionsObj).filter(
        (key) => updatedPermissionsObj[key as keyof typeof updatedPermissionsObj],
      );

      const res: any = await updatePetMemberPermissions(token, petId, targetUserId, {
        accessLevel,
        allowedModules,
        permissions: updatedPermissionsObj,
      } as any);

      // FORCE UPDATE: Explicitly modify the local cache array for 'petMembers'
      queryClient.setQueryData(['petMembers', petId], (oldMembersList: any) => {
        if (!oldMembersList || !Array.isArray(oldMembersList)) return oldMembersList;
        return oldMembersList.map((m: any) =>
          String(m._id || m.id || m.userId?._id) === String(targetUserId)
            ? { ...m, permissions: updatedPermissionsObj, allowedModules }
            : m
        );
      });

      // CRITICAL REDUX FIX: Immutably overwrite the state slice right now!
      dispatch(updateMemberPermissionsSuccess(targetUserId, updatedPermissionsObj) as any);

      // CRITICAL CACHE FLUSH: Invalidate and drop older server snapshots
      await queryClient.invalidateQueries({ queryKey: ['petMembers', petId] });
      await queryClient.invalidateQueries({ queryKey: ['activePetWorkspace'] });

      showSuccessToast("Member permissions updated successfully.");
      onUpdated({
        ...member,
        accessLevel,
        allowedModules,
        permissions: res.member?.permissions || updatedPermissionsObj,
      });
      onClose();
    } catch (err) {
      console.error("MUTATION_SAVE_SYNC_ERROR:", err);
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
      await removePetMember(token, petId, targetUserId);

      // CRITICAL: Invalidate and refetch immediately to kill the stale data bug
      await queryClient.invalidateQueries({ queryKey: ['activePetWorkspace'] });
      await queryClient.invalidateQueries({ queryKey: ['petMembers', petId] });

      showSuccessToast("Member removed from Family Hub successfully.");
      onUpdated(targetUserId);
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
      <FormSection title="Allowed Modules">
        {MODULE_OPTIONS.map((module) => {
          const isEnabled = isReadOnly ? getLivePermission(module.id) : getPermissionValue(module.id);
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
