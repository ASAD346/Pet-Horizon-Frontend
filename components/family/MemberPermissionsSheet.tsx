import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch } from '@/redux/store';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { SafeModal } from '@/components/ui/SafeModal';
import { AppText } from '@/components/ui/AppText';
import { getErrorMessage } from '@/lib/api/errors';
import { removePetMember, updatePetMemberPermissions } from '@/services/family/familyApi';
import { useToast } from '@/hooks/useToast';
import { usePetMembers } from '@/hooks/usePetMembers';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import type { PetMemberRow } from '@/types/family';

// ─── Module config with per-module color theming ────────────────────────────────
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

// ─── Avatar ─────────────────────────────────────────────────────────────────────
function MemberAvatarLarge({
  name,
  pictureUrl,
  color,
}: {
  name: string;
  pictureUrl?: string | null;
  color: string;
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const resolved = resolveMediaUrl(pictureUrl ?? undefined);

  if (resolved) {
    return (
      <View style={[av.outer, { borderColor: '#E2E8F0' }]}>
        <Image source={{ uri: resolved }} style={av.image} />
      </View>
    );
  }

  return (
    <View style={[av.outer, { borderColor: '#E2E8F0' }]}>
      <LinearGradient colors={['#334155', '#1E293B']} style={av.gradient}>
        <AppText style={av.initials}>{initials || 'U'}</AppText>
      </LinearGradient>
    </View>
  );
}

const av = StyleSheet.create({
  outer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  initials: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
});

// ─── Types ───────────────────────────────────────────────────────────────────────
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

// ─── Main Component ──────────────────────────────────────────────────────────────
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
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const [accessLevel, setAccessLevel] = useState<'readonly' | 'edit'>('readonly');
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccessToast, showErrorToast } = useToast();

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

  // ── Permission Query ────────────────────────────────────────────────────────
  const { data: memberPermissions } = useQuery({
    queryKey: ['family-permissions', targetUserId],
    queryFn: async () => {
      const rec = activeCachedMember || member;
      if (!rec) return {};
      const perms = rec.permissions || {};
      const allowed = rec.allowedModules ?? [];
      const check = (key: string) => {
        if ((perms as any)[key] !== undefined) return !!(perms as any)[key];
        if ((rec as any)[key] !== undefined) return !!(rec as any)[key];
        return !!(allowed.includes(key) || allowed.includes(key[0].toUpperCase() + key.slice(1)));
      };
      return {
        feeding: check('feeding'),
        walks: check('walks'),
        medicine: check('medicine'),
        grooming: check('grooming'),
        vaccination: check('vaccination'),
        journal: true,
        expenses: true,
      };
    },
    enabled: Boolean(visible && targetUserId),
  });

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
      queryClient.setQueryData(['family-permissions', targetUserId], {
        feeding: check('feeding'),
        walks: check('walks'),
        medicine: check('medicine'),
        grooming: check('grooming'),
        vaccination: check('vaccination'),
        journal: true,
        expenses: true,
      });
      setError(null);
    }
  }, [member, visible, activeCachedMember, targetUserId, queryClient]);

  const getVal = (id: string) =>
    !!memberPermissions?.[id as keyof typeof memberPermissions];

  const toggle = (id: string) => {
    const nextVal = !getVal(id);
    const updatedPerms = {
      ...(memberPermissions || {}),
      [id]: nextVal,
    };
    mutation.mutate(updatedPerms);
  };

  // ── Mutation ────────────────────────────────────────────────────────────────
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

      const allowedModules = [...Object.keys(permsObj).filter((k) => permsObj[k]), 'journal', 'expenses'];
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
      setError(getErrorMessage(err));
      showErrorToast(getErrorMessage(err));
    },
    onSuccess: (data) => {
      const sp =
        (data as any).member?.permissions || (data as any).permissions || memberPermissions;
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
    },
  });

  const handleAccessLevelChange = (level: 'readonly' | 'edit') => {
    if (accessLevel === level || isReadOnly) return;
    setAccessLevel(level);
    const perms: Record<string, boolean> = {
      feeding: getVal('feeding'),
      walks: getVal('walks'),
      medicine: getVal('medicine'),
      grooming: getVal('grooming'),
      vaccination: getVal('vaccination'),
      journal: true,
      expenses: true,
    };
    mutation.mutate(perms);
  };

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
  const bottomInset = Math.max(insets.bottom, 16);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={s.backdrop} onPress={onClose}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            {/* ── Modern Minimalist Header ── */}
            <View style={s.header}>
              {/* Drag handle */}
              <View style={s.handle} />

              {/* Close button */}
              <TouchableOpacity
                style={s.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#475569" />
              </TouchableOpacity>

              {/* Member identity */}
              <View style={s.identity}>
                <MemberAvatarLarge
                  name={memberName}
                  pictureUrl={memberPicture}
                  color="#1E293B"
                />
                <View style={s.identityText}>
                  <AppText
                    variant="h3"
                    weight="800"
                    color="#0F172A"
                    numberOfLines={1}
                    style={s.identityName}
                  >
                    {memberName}
                  </AppText>
                  {memberEmail ? (
                    <AppText
                      variant="caption"
                      color="#64748B"
                      numberOfLines={1}
                      style={s.identityEmail}
                    >
                      {memberEmail}
                    </AppText>
                  ) : null}
                  <View style={s.pillRow}>
                    <View style={s.memberPill}>
                      <Ionicons name="person-circle-outline" size={12} color="#0F172A" />
                      <AppText style={s.memberPillText}>MEMBER</AppText>
                    </View>
                    <View
                      style={[
                        s.accessPill,
                        accessLevel === 'edit' ? s.accessPillEdit : s.accessPillView,
                      ]}
                    >
                      <Ionicons
                        name={accessLevel === 'edit' ? 'create-outline' : 'eye-outline'}
                        size={11}
                        color={accessLevel === 'edit' ? '#047857' : '#475569'}
                      />
                      <AppText
                        style={[
                          s.accessPillText,
                          accessLevel === 'edit' ? { color: '#047857' } : { color: '#475569' },
                        ]}
                      >
                        {accessLevel === 'edit' ? 'Can Edit' : 'View Only'}
                      </AppText>
                    </View>
                    {isPremium && (
                      <View style={s.premiumPill}>
                        <Ionicons name="sparkles" size={10} color="#D97706" />
                        <AppText style={s.premiumPillText}>Premium</AppText>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Stats overview bar */}
              <View style={s.statsBar}>
                <View style={s.statItem}>
                  <View style={[s.statDot, { backgroundColor: '#10B981' }]} />
                  <AppText style={s.statVal}>{enabledCount}</AppText>
                  <AppText style={s.statLabel}>modules enabled</AppText>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <View style={[s.statDot, { backgroundColor: '#94A3B8' }]} />
                  <AppText style={s.statVal}>{MODULE_CONFIG.length - enabledCount}</AppText>
                  <AppText style={s.statLabel}>restricted</AppText>
                </View>
              </View>
            </View>

            {/* ── Scrollable Body ── */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.body}
              keyboardShouldPersistTaps="handled"
            >
              {/* Access Level Card */}
              {!isReadOnly && (
                <View style={s.card}>
                  <View style={s.cardHead}>
                    <View style={s.cardIconWrap}>
                      <Ionicons name="key" size={13} color="#0F172A" />
                    </View>
                    <AppText variant="caption" weight="800" color="#334155" style={s.cardTitle}>
                      PERMISSION ROLE
                    </AppText>
                  </View>
                  <View style={s.segRow}>
                    {(
                      [
                        { id: 'readonly', label: 'View Only', icon: 'eye-outline' },
                        { id: 'edit', label: 'Can Edit', icon: 'create-outline' },
                      ] as const
                    ).map((opt) => {
                      const active = accessLevel === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[s.segBtn, active && s.segBtnActive]}
                          onPress={() => handleAccessLevelChange(opt.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={14}
                            color={active ? '#0F172A' : '#64748B'}
                          />
                          <AppText
                            variant="caption"
                            weight={active ? '800' : '600'}
                            color={active ? '#0F172A' : '#64748B'}
                            style={{ fontSize: 13 }}
                          >
                            {opt.label}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Module Access Card */}
              <View style={s.card}>
                <View style={s.cardHead}>
                  <View style={s.cardIconWrap}>
                    <Ionicons name="grid" size={13} color="#0F172A" />
                  </View>
                  <AppText variant="caption" weight="800" color="#334155" style={s.cardTitle}>
                    MODULE PERMISSIONS
                  </AppText>
                  {isReadOnly && (
                    <View style={s.viewOnlyChip}>
                      <Ionicons name="eye-outline" size={11} color="#64748B" />
                      <AppText style={s.viewOnlyText}>View only</AppText>
                    </View>
                  )}
                </View>

                {MODULE_CONFIG.map((mod, idx) => {
                  const enabled = getVal(mod.id);
                  const isLast = idx === MODULE_CONFIG.length - 1;
                  return (
                    <View key={mod.id}>
                      <View style={s.modRow}>
                        {/* Icon */}
                        <View
                          style={[
                            s.modIcon,
                            {
                              backgroundColor: enabled ? mod.bg : '#F1F5F9',
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
                        {/* Text */}
                        <View style={{ flex: 1, gap: 2 }}>
                          <AppText
                            variant="bodySmall"
                            weight="700"
                            color={enabled ? '#0F172A' : '#64748B'}
                          >
                            {mod.label}
                          </AppText>
                          <AppText
                            style={[
                              s.modStatus,
                              { color: enabled ? mod.color : '#94A3B8' },
                            ]}
                          >
                            {enabled ? 'Allowed' : 'Restricted'}
                          </AppText>
                        </View>
                        {/* Switch */}
                        <Switch
                          value={enabled}
                          onValueChange={isReadOnly ? undefined : () => toggle(mod.id)}
                          trackColor={{ false: '#E2E8F0', true: mod.color + '55' }}
                          thumbColor={enabled ? mod.color : '#CBD5E1'}
                          ios_backgroundColor="#E2E8F0"
                          disabled={isReadOnly}
                        />
                      </View>
                      {!isLast && <View style={[s.modDivider, { marginLeft: 52 }]} />}
                    </View>
                  );
                })}
              </View>

              {/* Always-on modules info */}
              <View style={s.infoCard}>
                <View style={s.infoIconWrap}>
                  <Ionicons name="information" size={14} color="#0284C7" />
                </View>
                <AppText style={s.infoText}>
                  Journal and Expenses are always enabled for all active members.
                </AppText>
              </View>

              {/* Error */}
              {error ? (
                <View style={s.errorCard}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <AppText style={s.errorText}>{error}</AppText>
                </View>
              ) : null}
            </ScrollView>

            {/* ── Sticky Bottom Floating Footer (Fixes Cutoff) ── */}
            <View style={[s.footer, { paddingBottom: bottomInset }]}>
              {!isReadOnly ? (
                <View style={s.footerActions}>
                  <TouchableOpacity
                    style={[
                      s.removeIconBtn,
                      (removing || mutation.isPending) && { opacity: 0.5 },
                    ]}
                    onPress={confirmRemove}
                    disabled={removing || mutation.isPending}
                    activeOpacity={0.75}
                    accessibilityLabel="Remove Member"
                  >
                    <Ionicons name="trash-outline" size={19} color="#DC2626" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.doneBtn, removing && { opacity: 0.65 }]}
                    onPress={onClose}
                    disabled={removing}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <AppText style={s.doneBtnText}>Done</AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.readOnlyFooter}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#64748B" />
                  <AppText style={s.readOnlyText}>
                    Only pet owners can modify member permissions.
                  </AppText>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeModal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 28 },
    }),
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    paddingRight: 32,
  },
  identityText: { flex: 1, gap: 2 },
  identityName: { fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  identityEmail: { fontSize: 13, lineHeight: 17 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberPillText: { color: '#334155', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  accessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  accessPillEdit: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  accessPillView: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  accessPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  premiumPillText: { color: '#B45309', fontSize: 10, fontWeight: '800' },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
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
  statVal: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  statLabel: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 14, backgroundColor: '#E2E8F0' },

  // Body
  body: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { letterSpacing: 0.6, flex: 1, fontSize: 11 },
  viewOnlyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  viewOnlyText: { color: '#64748B', fontSize: 10, fontWeight: '700' },

  // Segmented
  segRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },

  // Module rows
  modRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  modIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modStatus: { fontSize: 11, fontWeight: '600' },
  modDivider: { height: 1, backgroundColor: '#F1F5F9' },

  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 12,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, color: '#0369A1', fontSize: 12, fontWeight: '600', lineHeight: 16 },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
  },
  errorText: { flex: 1, color: '#DC2626', fontSize: 12, fontWeight: '600', lineHeight: 16 },

  // Sticky Footer
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  removeIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

  // Read-only footer
  readOnlyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  readOnlyText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});
