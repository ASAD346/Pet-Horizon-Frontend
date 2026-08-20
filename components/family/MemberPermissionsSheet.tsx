import React, { useEffect, useState } from 'react';
import {
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
    color: '#F97316',
    bg: '#FFF7ED',
    border: '#FED7AA',
  },
  {
    id: 'walks',
    label: 'Walks',
    icon: 'dog' as const,
    iconLib: 'material' as const,
    color: '#10B981',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
  {
    id: 'medicine',
    label: 'Medicine',
    icon: 'medkit-outline' as const,
    iconLib: 'ionicon' as const,
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
  {
    id: 'grooming',
    label: 'Grooming',
    icon: 'cut-outline' as const,
    iconLib: 'ionicon' as const,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
  {
    id: 'vaccination',
    label: 'Vaccination',
    icon: 'shield-checkmark-outline' as const,
    iconLib: 'ionicon' as const,
    color: '#3B82F6',
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
      <View style={[av.outer, { borderColor: color }]}>
        <Image source={{ uri: resolved }} style={av.image} />
      </View>
    );
  }

  return (
    <View style={[av.outer, { borderColor: color }]}>
      <LinearGradient colors={[color, color + 'BB']} style={av.gradient}>
        <AppText style={av.initials}>{initials}</AppText>
      </LinearGradient>
    </View>
  );
}

const av = StyleSheet.create({
  outer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    overflow: 'hidden',
  },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  initials: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: 1 },
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

  // Stable avatar color derived from name
  const AVATAR_PALETTE = ['#3B82F6', '#8B5CF6', '#F97316', '#10B981', '#EF4444', '#EC4899'];
  const avatarColor = AVATAR_PALETTE[(memberName.charCodeAt(0) || 0) % AVATAR_PALETTE.length];

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
      // Cancel any in-flight queries for both caches we're about to touch
      await queryClient.cancelQueries({ queryKey: ['family-permissions', targetUserId] });
      await queryClient.cancelQueries({ queryKey: ['petMembers', petId] });

      const prev = queryClient.getQueryData(['family-permissions', targetUserId]);
      const prevMembers = queryClient.getQueryData(['petMembers', petId]);

      // Optimistically update the per-user permissions cache
      queryClient.setQueryData(['family-permissions', targetUserId], permsObj);

      // Optimistically update the pet-members list for instant toggle responsiveness
      const allowedModules = [...Object.keys(permsObj).filter((k) => permsObj[k]), 'journal', 'expenses'];
      queryClient.setQueryData(['petMembers', petId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((m: any) =>
          String(m._id || m.id || m.userId?._id) === String(targetUserId)
            ? { ...m, permissions: { ...permsObj, journal: true, expenses: true }, allowedModules, accessLevel }
            : m,
        );
      });

      // Update Redux state immediately
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

  const gradientColors: [string, string, string] = isPremium
    ? ['#0B2A19', '#163D24', '#1F5232']
    : ['#1B5E20', '#2E7D32', '#388E3C'];
  const accentColor = isPremium ? '#D4A017' : '#2E7D32';
  const enabledCount = MODULE_CONFIG.filter((m) => getVal(m.id)).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={s.backdrop} onPress={onClose}>
          <Pressable
            style={[s.sheet, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}
            onPress={() => {}}
          >
            {/* ── Gradient Header ── */}
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.header}
            >
              {/* Drag handle */}
              <View style={s.handle} />

              {/* Close button */}
              <Pressable style={s.closeBtn} onPress={onClose} hitSlop={14}>
                <Ionicons name="close" size={17} color="rgba(255,255,255,0.9)" />
              </Pressable>

              {/* Member identity */}
              <View style={s.identity}>
                <MemberAvatarLarge
                  name={memberName}
                  pictureUrl={memberPicture}
                  color={avatarColor}
                />
                <View style={s.identityText}>
                  <AppText
                    variant="h3"
                    weight="800"
                    color="#FFFFFF"
                    numberOfLines={1}
                    style={s.identityName}
                  >
                    {memberName}
                  </AppText>
                  {memberEmail ? (
                    <AppText
                      variant="caption"
                      color="rgba(255,255,255,0.6)"
                      numberOfLines={1}
                    >
                      {memberEmail}
                    </AppText>
                  ) : null}
                  <View style={s.pillRow}>
                    <View style={s.memberPill}>
                      <Ionicons name="person-outline" size={9} color="#93C5FD" />
                      <AppText style={s.memberPillText}>MEMBER</AppText>
                    </View>
                    <View style={s.accessPill}>
                      <Ionicons
                        name={accessLevel === 'edit' ? 'create-outline' : 'eye-outline'}
                        size={9}
                        color="rgba(255,255,255,0.7)"
                      />
                      <AppText style={s.accessPillText}>
                        {accessLevel === 'edit' ? 'Can Edit' : 'View Only'}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Stats row */}
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <AppText style={s.statVal}>{enabledCount}</AppText>
                  <AppText style={s.statLabel}>modules on</AppText>
                </View>
                <View style={s.statSep} />
                <View style={s.statItem}>
                  <AppText style={s.statVal}>{MODULE_CONFIG.length - enabledCount}</AppText>
                  <AppText style={s.statLabel}>restricted</AppText>
                </View>
                <View style={s.statSep} />
                <View style={s.statItem}>
                  <Ionicons
                    name={isPremium ? 'star' : 'star-outline'}
                    size={13}
                    color={isPremium ? '#D4A017' : 'rgba(255,255,255,0.4)'}
                  />
                  <AppText style={[s.statLabel, { marginLeft: 4 }]}>
                    {isPremium ? 'Premium' : 'Free'}
                  </AppText>
                </View>
              </View>
            </LinearGradient>

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
                      <Ionicons name="key-outline" size={14} color="#2E7D32" />
                    </View>
                    <AppText variant="caption" weight="800" color="#5C6470" style={s.cardTitle}>
                      ACCESS LEVEL
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
                          style={[s.segBtn, active && [s.segBtnActive, { borderColor: accentColor }]]}
                          onPress={() => setAccessLevel(opt.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={13}
                            color={active ? accentColor : '#94A3B8'}
                          />
                          <AppText
                            variant="caption"
                            weight={active ? '800' : '600'}
                            color={active ? accentColor : '#94A3B8'}
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
                    <Ionicons name="apps-outline" size={14} color="#2E7D32" />
                  </View>
                  <AppText variant="caption" weight="800" color="#5C6470" style={s.cardTitle}>
                    MODULE ACCESS
                  </AppText>
                  {isReadOnly && (
                    <View style={s.viewOnlyChip}>
                      <Ionicons name="eye-outline" size={10} color="#64748B" />
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
                              backgroundColor: enabled ? mod.bg : '#F8FAFC',
                              borderColor: enabled ? mod.border : '#E2E8F0',
                            },
                          ]}
                        >
                          {mod.iconLib === 'material' ? (
                            <MaterialCommunityIcons
                              name={mod.icon as any}
                              size={17}
                              color={enabled ? mod.color : '#CBD5E1'}
                            />
                          ) : (
                            <Ionicons
                              name={mod.icon as any}
                              size={17}
                              color={enabled ? mod.color : '#CBD5E1'}
                            />
                          )}
                        </View>
                        {/* Text */}
                        <View style={{ flex: 1, gap: 1 }}>
                          <AppText
                            variant="bodySmall"
                            weight="700"
                            color={enabled ? '#1C1F24' : '#94A3B8'}
                          >
                            {mod.label}
                          </AppText>
                          <AppText
                            style={[
                              s.modStatus,
                              { color: enabled ? mod.color : '#CBD5E1' },
                            ]}
                          >
                            {enabled ? 'Allowed' : 'Restricted'}
                          </AppText>
                        </View>
                        {/* Switch */}
                        <Switch
                          value={enabled}
                          onValueChange={isReadOnly ? undefined : () => toggle(mod.id)}
                          trackColor={{ false: '#E5E7EB', true: mod.color + '55' }}
                          thumbColor={enabled ? mod.color : '#E2E8F0'}
                          ios_backgroundColor="#E5E7EB"
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
                  <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                </View>
                <AppText style={s.infoText}>
                  Journal and Expenses are always enabled for all members.
                </AppText>
              </View>

              {/* Error */}
              {error ? (
                <View style={s.errorCard}>
                  <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />
                  <AppText style={s.errorText}>{error}</AppText>
                </View>
              ) : null}

              {/* Actions */}
              {!isReadOnly ? (
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[
                      s.saveBtn,
                      { backgroundColor: accentColor },
                      removing && { opacity: 0.65 },
                    ]}
                    onPress={onClose}
                    disabled={removing}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
                    <AppText style={s.saveBtnText}>Done</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.removeBtn, (removing || mutation.isPending) && { opacity: 0.6 }]}
                    onPress={handleRemove}
                    disabled={removing || mutation.isPending}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="person-remove-outline" size={15} color="#DC2626" />
                    <AppText style={s.removeBtnText}>
                      {removing ? 'Removing…' : 'Remove from Family'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.readOnlyFooter}>
                  <View style={s.readOnlyIcon}>
                    <Ionicons name="shield-checkmark-outline" size={17} color="#64748B" />
                  </View>
                  <AppText style={s.readOnlyText}>
                    These are the workspace permissions assigned to this caregiver. Only the pet
                    owner can modify them.
                  </AppText>
                </View>
              )}
            </ScrollView>
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
    backgroundColor: 'rgba(10,15,30,0.58)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '93%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 28 },
    }),
  },

  // Header
  header: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: 10,
    marginBottom: 14,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  identityText: { flex: 1, gap: 3 },
  identityName: { fontSize: 19, lineHeight: 25 },
  pillRow: { flexDirection: 'row', gap: 6, marginTop: 3 },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(147,197,253,0.15)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.22)',
  },
  memberPillText: { color: '#93C5FD', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  accessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  accessPillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  statVal: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.58)', fontSize: 11, fontWeight: '600' },
  statSep: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.14)' },

  // Body
  body: { padding: 14, gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
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
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { letterSpacing: 0.7, flex: 1 },
  viewOnlyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  viewOnlyText: { color: '#64748B', fontSize: 10, fontWeight: '700' },

  // Segmented
  segRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },

  // Module rows
  modRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
  },
  modIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
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
  infoIconWrap: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, color: '#64748B', fontSize: 12, fontWeight: '600', lineHeight: 17 },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
  },
  errorText: { flex: 1, color: '#DC2626', fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // Actions
  actions: { gap: 10, marginTop: 2 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#114227',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  removeBtnText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },

  // Read-only footer
  readOnlyFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 2,
  },
  readOnlyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  readOnlyText: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
});
