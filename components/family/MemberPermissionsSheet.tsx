import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { FormSheetShell, FormSection, FormSegmentedControl } from '@/components/sheets';
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
    icon: 'restaurant-outline' as const,
    iconLib: 'ionicon' as const,
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
  },
  {
    id: 'walks',
    label: 'Walks',
    icon: 'dog' as const,
    iconLib: 'material' as const,
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
  {
    id: 'medicine',
    label: 'Medicine',
    icon: 'medkit-outline' as const,
    iconLib: 'ionicon' as const,
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
  {
    id: 'grooming',
    label: 'Grooming',
    icon: 'cut-outline' as const,
    iconLib: 'ionicon' as const,
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
  {
    id: 'vaccination',
    label: 'Vaccination',
    icon: 'shield-checkmark-outline' as const,
    iconLib: 'ionicon' as const,
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
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
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const resolved = resolveMediaUrl(pictureUrl ?? undefined);

  if (resolved) {
    return (
      <View style={styles.avatarWrap}>
        <Image source={{ uri: resolved }} style={styles.avatarImage} />
      </View>
    );
  }

  return (
    <View style={styles.avatarWrap}>
      <LinearGradient colors={['#166534', '#114227']} style={styles.avatarGradient}>
        <AppText style={styles.avatarInitials}>{initials || 'U'}</AppText>
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

  const [accessLevel, setAccessLevel] = useState<'readonly' | 'edit'>('readonly');
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
  const memberPicture = member?.userId?.profileImage || (member as any)?.profileImage || null;

  // ── Sync data on open ───────────────────────────────────────────────────────
  useEffect(() => {
    const rec = activeCachedMember || member;
    if (visible && rec) {
      setAccessLevel(rec.accessLevel === 'edit' ? 'edit' : 'readonly');
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
        accessLevel,
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
            ? { ...m, permissions: { ...permsObj, journal: true, expenses: true }, allowedModules, accessLevel }
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
            ? { ...m, permissions: sp, allowedModules, accessLevel }
            : m,
        );
      });
      queryClient.invalidateQueries({ queryKey: ['petMembers', petId] });
      queryClient.invalidateQueries({ queryKey: ['activePetWorkspace'] });
      showSuccessToast('Permissions saved successfully.');
      onUpdated({ ...member, accessLevel, allowedModules, permissions: sp } as any);
      onClose();
    },
  });

  const handleSave = () => {
    mutation.mutate(localPermissions);
  };

  // ── Remove Member ───────────────────────────────────────────────────────────
  const confirmRemove = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this pet's Family Hub? They will lose access immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: handleRemove },
      ],
      { cancelable: true },
    );
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

  const enabledCount = MODULE_CONFIG.filter((m) => getVal(m.id)).length;

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title="Member Permissions"
      subtitle="Manage access and module controls"
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
      {/* ── 1. Member Profile Hero Card ── */}
      <View style={styles.memberCard}>
        <View style={styles.memberHeaderRow}>
          <MemberAvatarLarge name={memberName} pictureUrl={memberPicture} />
          <View style={styles.memberInfoCol}>
            <AppText variant="h3" weight="800" color="#0F172A" numberOfLines={1}>
              {memberName}
            </AppText>
            {memberEmail ? (
              <AppText variant="caption" color="#64748B" numberOfLines={1} style={styles.emailText}>
                {memberEmail}
              </AppText>
            ) : null}

            <View style={styles.badgeRow}>
              <View style={styles.memberBadge}>
                <Ionicons name="person-circle-outline" size={12} color="#166534" />
                <AppText style={styles.memberBadgeText}>MEMBER</AppText>
              </View>

              <View
                style={[
                  styles.roleBadge,
                  accessLevel === 'edit' ? styles.roleBadgeEdit : styles.roleBadgeView,
                ]}
              >
                <Ionicons
                  name={accessLevel === 'edit' ? 'create-outline' : 'eye-outline'}
                  size={11}
                  color={accessLevel === 'edit' ? '#047857' : '#475569'}
                />
                <AppText
                  style={[
                    styles.roleBadgeText,
                    accessLevel === 'edit' ? { color: '#047857' } : { color: '#475569' },
                  ]}
                >
                  {accessLevel === 'edit' ? 'Can Edit' : 'View Only'}
                </AppText>
              </View>

              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="sparkles" size={10} color="#D97706" />
                  <AppText style={styles.premiumBadgeText}>Premium</AppText>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats counter */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
            <AppText style={styles.statVal}>{enabledCount}</AppText>
            <AppText style={styles.statLabel}>modules enabled</AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#94A3B8' }]} />
            <AppText style={styles.statVal}>{MODULE_CONFIG.length - enabledCount}</AppText>
            <AppText style={styles.statLabel}>restricted</AppText>
          </View>
        </View>
      </View>

      {/* ── 2. Permission Role ── */}
      <FormSection title="Permission Role" icon="key-outline">
        <FormSegmentedControl
          selected={accessLevel}
          onSelect={(val) => setAccessLevel(val as 'readonly' | 'edit')}
          options={[
            { value: 'readonly', label: 'View Only' },
            { value: 'edit', label: 'Can Edit' },
          ]}
        />
      </FormSection>

      {/* ── 3. Module Permissions ── */}
      <FormSection title="Module Permissions" icon="view-grid-outline">
        <View style={styles.modulesCard}>
          {MODULE_CONFIG.map((mod, idx) => {
            const enabled = getVal(mod.id);
            const isLast = idx === MODULE_CONFIG.length - 1;

            return (
              <View key={mod.id}>
                <View style={styles.moduleRow}>
                  <View
                    style={[
                      styles.modIcon,
                      {
                        backgroundColor: enabled ? mod.bg : '#F8FAFC',
                        borderColor: enabled ? mod.border : '#E2E8F0',
                      },
                    ]}
                  >
                    {mod.iconLib === 'material' ? (
                      <MaterialCommunityIcons
                        name={mod.icon as any}
                        size={18}
                        color={enabled ? mod.color : '#94A3B8'}
                      />
                    ) : (
                      <Ionicons
                        name={mod.icon as any}
                        size={18}
                        color={enabled ? mod.color : '#94A3B8'}
                      />
                    )}
                  </View>

                  <View style={styles.modTextCol}>
                    <AppText
                      variant="bodySmall"
                      weight="700"
                      color={enabled ? '#0F172A' : '#64748B'}
                    >
                      {mod.label}
                    </AppText>
                    <AppText
                      variant="caption"
                      weight="600"
                      style={{ color: enabled ? mod.color : '#94A3B8', fontSize: 11 }}
                    >
                      {enabled ? 'Allowed' : 'Restricted'}
                    </AppText>
                  </View>

                  <Switch
                    value={enabled}
                    onValueChange={() => toggle(mod.id)}
                    trackColor={{ false: '#E2E8F0', true: mod.color + '55' }}
                    thumbColor={enabled ? mod.color : '#CBD5E1'}
                    ios_backgroundColor="#E2E8F0"
                    disabled={isReadOnly}
                  />
                </View>

                {!isLast && <View style={styles.modDivider} />}
              </View>
            );
          })}
        </View>

        {/* Always-on info note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
          <AppText style={styles.infoText}>
            Journal and Expenses are always enabled for all family members.
          </AppText>
        </View>
      </FormSection>

      {/* ── 4. Danger Zone / Remove Member ── */}
      {!isReadOnly && (
        <FormSection title="Manage Access" icon="account-cancel-outline">
          <TouchableOpacity
            style={[
              styles.removeButton,
              (removing || mutation.isPending) && { opacity: 0.6 },
            ]}
            onPress={confirmRemove}
            disabled={removing || mutation.isPending}
            activeOpacity={0.75}
          >
            <View style={styles.removeIconWrap}>
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </View>
            <View style={styles.removeTextCol}>
              <AppText variant="bodySmall" weight="700" color="#DC2626">
                Remove Member from Family
              </AppText>
              <AppText variant="caption" color="#991B1B" style={{ fontSize: 11 }}>
                Revokes pet access immediately
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#F87171" />
          </TouchableOpacity>
        </FormSection>
      )}
    </FormSheetShell>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: FormSheetColors.sectionBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  memberHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  memberInfoCol: {
    flex: 1,
    gap: 2,
  },
  emailText: {
    fontSize: 12,
    marginBottom: 4,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  memberBadgeText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
  },
  roleBadgeEdit: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  roleBadgeView: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
  },
  premiumBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statVal: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },

  // Modules card
  modulesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: FormSheetColors.inputBorder,
    overflow: 'hidden',
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
  modTextCol: {
    flex: 1,
    gap: 1,
  },
  modDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 58,
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

  // Remove Button
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  removeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTextCol: {
    flex: 1,
    gap: 1,
  },
});
