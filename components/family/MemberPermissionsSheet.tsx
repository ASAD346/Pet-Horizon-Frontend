import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const [accessLevel, setAccessLevel] = useState<'readonly' | 'edit'>('readonly');
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

  // useQuery to track the family permissions
  const { data: memberPermissions } = useQuery({
    queryKey: ['family-permissions', targetUserId],
    queryFn: async () => {
      const targetRecord = activeCachedMember || member;
      if (!targetRecord) return {};
      const currentPerms = targetRecord.permissions || {};
      const allowed = targetRecord.allowedModules ?? [];
      const getCheck = (key: string) => {
        if ((currentPerms as any)[key] !== undefined) return !!(currentPerms as any)[key];
        if ((targetRecord as any)[key] !== undefined) return !!(targetRecord as any)[key];
        const targetMatch = key.charAt(0).toUpperCase() + key.slice(1);
        return !!(allowed.includes(key) || allowed.includes(targetMatch));
      };

      return {
        feeding: getCheck('feeding'),
        walks: getCheck('walks'),
        medicine: getCheck('medicine'),
        grooming: getCheck('grooming'),
        vaccination: getCheck('vaccination'),
        journal: true,
        expenses: true,
      };
    },
    enabled: Boolean(visible && targetUserId),
  });

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

      const initialPerms = {
        feeding: getCheck('feeding'),
        walks: getCheck('walks'),
        medicine: getCheck('medicine'),
        grooming: getCheck('grooming'),
        vaccination: getCheck('vaccination'),
        journal: true,
        expenses: true,
      };

      queryClient.setQueryData(['family-permissions', targetUserId], initialPerms);
      setError(null);
    }
  }, [member, visible, activeCachedMember, targetUserId, queryClient]);

  const getPermissionValue = (moduleId: string) => {
    return !!memberPermissions?.[moduleId as keyof typeof memberPermissions];
  };

  const togglePermissionValue = (moduleId: string) => {
    const currentVal = getPermissionValue(moduleId);
    const updated = {
      ...(memberPermissions || {}),
      [moduleId]: !currentVal,
    };
    queryClient.setQueryData(['family-permissions', targetUserId], updated);
  };

  const mutation = useMutation({
    mutationFn: async (updatedPermissionsObj: Record<string, boolean>) => {
      if (!token || !petId || !member) throw new Error("Required variables missing");
      const allowedModules = [
        ...Object.keys(updatedPermissionsObj).filter((key) => updatedPermissionsObj[key]),
        'journal',
        'expenses'
      ];

      // Trigger Redux sync optimistically
      dispatch({
        type: 'family/updateMemberPermissionsSuccess',
        payload: { memberId: targetUserId, permissions: { ...updatedPermissionsObj, journal: true, expenses: true } }
      });

      return await updatePetMemberPermissions(token, petId, targetUserId, {
        accessLevel,
        allowedModules,
        permissions: { ...updatedPermissionsObj, journal: true, expenses: true },
      } as any);
    },
    onMutate: async (updatedPermissionsObj) => {
      await queryClient.cancelQueries({ queryKey: ['family-permissions', targetUserId] });
      const previousPermissions = queryClient.getQueryData(['family-permissions', targetUserId]);
      queryClient.setQueryData(['family-permissions', targetUserId], updatedPermissionsObj);
      return { previousPermissions };
    },
    onError: (err, newPermissions, context) => {
      if (context?.previousPermissions) {
        queryClient.setQueryData(['family-permissions', targetUserId], context.previousPermissions);
      }
      setError(getErrorMessage(err));
      showErrorToast(getErrorMessage(err));
    },
    onSuccess: (data) => {
      const serverPermissions = data.member?.permissions || data.permissions || memberPermissions;
      queryClient.setQueryData(['family-permissions', targetUserId], serverPermissions);
      
      const allowedModules = Object.keys(serverPermissions).filter((k) => serverPermissions[k]);

      // Atomic cache update for petMembers query list
      queryClient.setQueryData(['petMembers', petId], (oldMembersList: any) => {
        if (!oldMembersList || !Array.isArray(oldMembersList)) return oldMembersList;
        return oldMembersList.map((m: any) =>
          String(m._id || m.id || m.userId?._id) === String(targetUserId)
            ? { ...m, permissions: serverPermissions, allowedModules, accessLevel }
            : m
        );
      });

      queryClient.invalidateQueries({ queryKey: ['petMembers', petId] });
      queryClient.invalidateQueries({ queryKey: ['activePetWorkspace'] });
      
      showSuccessToast("Permissions saved successfully.");
      onUpdated({
        ...member,
        accessLevel,
        allowedModules,
        permissions: serverPermissions,
      } as any);
      onClose();
    },
  });

  const handleSave = () => {
    mutation.mutate(memberPermissions || {});
  };

  const handleRemove = async () => {
    if (!token || !petId || !member) return;
    setRemoving(true);
    setError(null);
    try {
      await removePetMember(token, petId, targetUserId);

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
      saving={mutation.isPending}
      saveDisabled={removing}
      error={error}
      isReadOnly={isReadOnly}
      compact
    >
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
            disabled={mutation.isPending}
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
