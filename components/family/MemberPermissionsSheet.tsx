import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAppDispatch } from '@/redux/store';
import { AppText } from '@/components/ui/AppText';
import { AppConfirmModal } from '@/components/ui/AppConfirmModal';
import { FormSheetShell } from '@/components/sheets';
import { Radius, Spacing } from '@/constants/theme';
import { FormSheetColors } from '@/components/sheets/formSheetStyles';
import { getErrorMessage } from '@/lib/api/errors';
import { removePetMember, updatePetMemberPermissions } from '@/services/family/familyApi';
import { useToast } from '@/hooks/useToast';
import { usePetMembers } from '@/hooks/usePetMembers';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { PetMemberRow } from '@/types/family';

// ─── Module Config ─────────────────────────────────────────────────────────────
const MODULE_CONFIG = [
  {
    id: 'feeding',
    label: 'Feeding',
    icon: 'silverware-fork-knife' as const,
  },
  {
    id: 'walks',
    label: 'Walks',
    icon: 'paw' as const,
  },
  {
    id: 'medicine',
    label: 'Medicine',
    icon: 'pill' as const,
  },
  {
    id: 'grooming',
    label: 'Grooming',
    icon: 'content-cut' as const,
  },
  {
    id: 'vaccination',
    label: 'Vaccination',
    icon: 'needle' as const,
  },
] as const;

// ─── Avatar Component ──────────────────────────────────────────────────────────
function MemberAvatarLarge({
  name,
  pictureUrl,
}: {
  name: string;
  pictureUrl?: string | null;
}) {
  const [imageError, setImageError] = useState(false);
  const initial = (name.trim()[0] || 'U').toUpperCase();

  const resolved = resolveMediaUrl(pictureUrl ?? undefined);

  if (resolved && !imageError) {
    return (
      <View style={styles.avatarWrap}>
        <Image
          source={{ uri: resolved }}
          style={styles.avatarImage}
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  return (
    <View style={styles.avatarWrap}>
      <LinearGradient colors={['#166534', '#114227']} style={styles.avatarGradient}>
        <AppText style={styles.avatarInitials}>{initial}</AppText>
      </LinearGradient>
    </View>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Main Component ────────────────────────────────────────────────────────────
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
  const dispatch = useAppDispatch();
  const { showSuccessToast, showErrorToast } = useToast();

  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({
    feeding: false,
    walks: false,
    medicine: false,
    grooming: false,
    vaccination: false,
    journal: true,
    expenses: true,
  });
  const [removing, setRemoving] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { members: membersList } = usePetMembers(token, petId, !isReadOnly);

  const targetUserId =
    member?.userId?._id || (member as any)?.id || (member as any)?._id || '';

  const activeCachedMember = membersList?.find(
    (m) =>
      String(m.userId?._id || (m as any).id || (m as any)._id) === String(targetUserId),
  );

  const memberName =
    member?.userId?.fullName ||
    (member as any)?.fullName ||
    (member as any)?.name ||
    'Care Member';

  const memberEmail = member?.userId?.email || (member as any)?.email || '';
  const memberPicture =
    member?.userId?.profileImage ||
    (member as any)?.profileImage ||
    (member as any)?.profilePicture ||
    (member as any)?.pictureUrl ||
    (activeCachedMember?.userId as any)?.profileImage ||
    (activeCachedMember as any)?.profileImage ||
    (activeCachedMember as any)?.profilePicture ||
    null;

  // ── Sync data on open ───────────────────────────────────────────────────────
  useEffect(() => {
    const rec = activeCachedMember || member;
    if (visible && rec) {
      const perms = rec.permissions || {};
      const allowed = rec.allowedModules ?? [];
      const check = (key: string) => {
        if ((perms as any)[key] !== undefined) return !!(perms as any)[key];
        if ((rec as any)[key] !== undefined) return !!(rec as any)[key];
        return !!(allowed.includes(key) || allowed.includes(key[0].toUpperCase() + key.slice(1)));
      };

      const initialPerms = {
        feeding: check('feeding'),
        walks: check('walks'),
        medicine: check('medicine'),
        grooming: check('grooming'),
        vaccination: check('vaccination'),
        journal: true,
        expenses: true,
      };

      setLocalPermissions(initialPerms);
      setError(null);
      setDeleteConfirmVisible(false);
    }
  }, [member, visible, activeCachedMember]);

  const getVal = (id: string) => !!localPermissions[id];

  const toggle = (id: string) => {
    if (isReadOnly) return;
    setLocalPermissions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ── Save Mutation ───────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (permsObj: Record<string, boolean>) => {
      if (!token || !petId || !member) throw new Error('Required variables missing');
      const allowedModules = [
        ...Object.keys(permsObj).filter((k) => permsObj[k]),
        'journal',
        'expenses',
      ];
      return await updatePetMemberPermissions(token, petId, targetUserId, {
        accessLevel: 'edit',
        allowedModules,
        permissions: { ...permsObj, journal: true, expenses: true },
      } as any);
    },
    onMutate: async (permsObj) => {
      await queryClient.cancelQueries({ queryKey: ['family-permissions', targetUserId] });
      await queryClient.cancelQueries({ queryKey: ['petMembers', petId] });

      const prev = queryClient.getQueryData(['family-permissions', targetUserId]);
      const prevMembers = queryClient.getQueryData(['petMembers', petId]);

      queryClient.setQueryData(['family-permissions', targetUserId], permsObj);

      const allowedModules = [
        ...Object.keys(permsObj).filter((k) => permsObj[k]),
        'journal',
        'expenses',
      ];
      queryClient.setQueryData(['petMembers', petId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((m: any) =>
          String(m._id || m.id || m.userId?._id) === String(targetUserId)
            ? { ...m, permissions: { ...permsObj, journal: true, expenses: true }, allowedModules, accessLevel: 'edit' }
            : m,
        );
      });

      dispatch({
        type: 'family/updateMemberPermissionsSuccess',
        payload: { memberId: targetUserId, permissions: { ...permsObj, journal: true, expenses: true } },
      });

      return { previousPermissions: prev, previousMembers: prevMembers };
    },
    onError: (err, _new, ctx) => {
      if (ctx?.previousPermissions) {
        queryClient.setQueryData(['family-permissions', targetUserId], ctx.previousPermissions);
        dispatch({
          type: 'family/updateMemberPermissionsSuccess',
          payload: { memberId: targetUserId, permissions: ctx.previousPermissions },
        });
      }
      if (ctx?.previousMembers !== undefined) {
        queryClient.setQueryData(['petMembers', petId], ctx.previousMembers);
      }
      const msg = getErrorMessage(err);
      setError(msg);
      showErrorToast(msg);
    },
    onSuccess: (data) => {
      const sp =
        (data as any).member?.permissions || (data as any).permissions || localPermissions;
      queryClient.setQueryData(['family-permissions', targetUserId], sp);
      const allowedModules = Object.keys(sp).filter((k) => sp[k]);
      queryClient.setQueryData(['petMembers', petId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((m: any) =>
          String(m._id || m.id || m.userId?._id) === String(targetUserId)
            ? { ...m, permissions: sp, allowedModules, accessLevel: 'edit' }
            : m,
        );
      });
      queryClient.invalidateQueries({ queryKey: ['petMembers', petId] });
      queryClient.invalidateQueries({ queryKey: ['activePetWorkspace'] });
      showSuccessToast('Permissions saved successfully.');
      onUpdated({ ...member, accessLevel: 'edit', allowedModules, permissions: sp } as any);
      onClose();
    },
  });

  const handleSave = () => {
    mutation.mutate(localPermissions);
  };

  // ── Remove Member ───────────────────────────────────────────────────────────
  const confirmRemove = () => {
    setDeleteConfirmVisible(true);
  };

  const handleRemove = async () => {
    if (!token || !petId || !member) return;
    setRemoving(true);
    setError(null);
    try {
      await removePetMember(token, petId, targetUserId);
      await queryClient.invalidateQueries({ queryKey: ['activePetWorkspace'] });
      await queryClient.invalidateQueries({ queryKey: ['petMembers', petId] });
      showSuccessToast('Member removed from Family Hub successfully.');
      setDeleteConfirmVisible(false);
      onUpdated(targetUserId);
      onClose();
    } catch (err: any) {
      const msg =
        err?.message || getErrorMessage(err) || 'Failed to remove the member. Please try again.';
      setError(msg);
      showErrorToast(msg);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title="Member Permissions"
      subtitle="Manage caregiver access modules"
      icon="shield-account-outline"
      saveLabel="Save Permissions"
      onSave={isReadOnly ? undefined : handleSave}
      saving={mutation.isPending}
      saveDisabled={mutation.isPending || removing}
      error={error}
      isReadOnly={isReadOnly}
      blockIfReadOnly={false}
      compact
    >
      {/* ── Single Unified Permissions Card ── */}
      <View style={styles.unifiedCard}>
        {/* 1. Member Profile Header */}
        <View style={styles.memberHeaderRow}>
          <MemberAvatarLarge name={memberName} pictureUrl={memberPicture} />
          <View style={styles.memberInfoCol}>
            <AppText variant="h3" weight="800" color="#0F172A" numberOfLines={1}>
              {memberName}
            </AppText>

            <View style={styles.badgeRow}>
              <View style={styles.memberBadge}>
                <View style={styles.memberDot} />
                <AppText style={styles.memberBadgeText}>Member</AppText>
              </View>
            </View>
          </View>

          {/* Remove Member Header Action */}
          {!isReadOnly && (
            <TouchableOpacity
              style={[
                styles.headerRemoveBtn,
                (removing || mutation.isPending) && { opacity: 0.5 },
              ]}
              onPress={confirmRemove}
              disabled={removing || mutation.isPending}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Remove member"
            >
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderIconWrap}>
            <MaterialCommunityIcons name="view-grid-outline" size={14} color="#166534" />
          </View>
          <AppText style={styles.sectionHeaderTitle}>MODULE ACCESS</AppText>
        </View>

        {/* 3. Module Permissions List */}
        <View style={styles.moduleList}>
          {MODULE_CONFIG.map((mod, idx) => {
            const enabled = getVal(mod.id);
            const isLast = idx === MODULE_CONFIG.length - 1;

            return (
              <View key={mod.id}>
                <View style={styles.moduleRow}>
                  <View
                    style={[
                      styles.modIcon,
                      enabled ? styles.modIconActive : styles.modIconInactive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={mod.icon}
                      size={18}
                      color={enabled ? '#166534' : '#94A3B8'}
                    />
                  </View>

                  <View style={styles.modTextCol}>
                    <AppText
                      variant="bodySmall"
                      weight="700"
                      color={enabled ? '#0F172A' : '#64748B'}
                      style={{ fontSize: 14 }}
                    >
                      {mod.label}
                    </AppText>
                    <AppText
                      variant="caption"
                      weight="600"
                      style={{ color: enabled ? '#15803D' : '#94A3B8', fontSize: 11 }}
                    >
                      {enabled ? 'Allowed access' : 'Restricted access'}
                    </AppText>
                  </View>

                  <Switch
                    value={enabled}
                    onValueChange={() => toggle(mod.id)}
                    trackColor={{ false: '#E2E8F0', true: '#BBF7D0' }}
                    thumbColor={enabled ? '#166534' : '#CBD5E1'}
                    ios_backgroundColor="#E2E8F0"
                    disabled={isReadOnly}
                  />
                </View>

                {!isLast && <View style={styles.modDivider} />}
              </View>
            );
          })}
        </View>

        {/* 4. Integrated Note Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
          <AppText style={styles.infoText}>
            Journal and Expenses modules are always enabled for all family members.
          </AppText>
        </View>
      </View>

      <AppConfirmModal
        visible={deleteConfirmVisible}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberName} from this pet's Family Hub? They will lose access immediately.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => {
          if (!removing) setDeleteConfirmVisible(false);
        }}
      />
    </FormSheetShell>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  unifiedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1.5 },
    }),
  },
  memberHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberInfoCol: {
    flex: 1,
    gap: 4,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignSelf: 'flex-start',
  },
  memberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  memberBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionHeaderIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },

  // Modules list
  moduleList: {
    marginTop: 2,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  modIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modIconActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  modIconInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  modTextCol: {
    flex: 1,
    gap: 1,
  },
  modDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 48,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Header Remove Button
  headerRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
