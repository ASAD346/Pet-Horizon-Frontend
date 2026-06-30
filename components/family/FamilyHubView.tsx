import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useToast } from '@/hooks/useToast';
import { FamilyHubHeader } from './FamilyHubHeader';
import { FamilyOverviewCard } from '@/components/family/FamilyOverviewCard';
import { InviteFamilySheet } from '@/components/family/InviteFamilySheet';
import { MemberPermissionsSheet } from '@/components/family/MemberPermissionsSheet';
import { MembersListSection } from '@/components/family/MembersListSection';
import { HomeTheme, Spacing } from '@/constants/theme';
import { SkeletonFamilyHub } from '@/components/ui/skeletons';
import { useStaleLoadScope } from '@/hooks/useStaleLoadScope';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePetMembers } from '@/hooks/usePetMembers';
import { usePetPermissions } from '@/hooks/usePetPermissions';
import { LogJournalSheet } from '@/components/journal';
import { generatePetInvite } from '@/services/family/familyApi';
import { fetchPremiumStatus } from '@/services/premium/premiumApi';
import {
  buildFamilyMembersList,
  buildGuestMemberDisplay,
  formatJoinCode,
  isPetOwner,
} from '@/lib/family/formatters';
import {
  buildInviteShareMessage,
  resolveInviteAppLink,
  resolveInviteWebLink,
} from '@/lib/family/inviteLinks';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchPetPermissions } from '@/services/schedules/feedingApi';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { useTabHeaderActions } from '@/hooks/useTabHeaderActions';
import type { FamilyMemberDisplay, GenerateInviteResponse, PetMemberRow } from '@/types/family';

export function FamilyHubView() {
  const insets = useSafeAreaInsets();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { notificationCount, onNotificationsPress } = useTabHeaderActions();
  const { token, user } = useAuth();
  const { pet, loading: petLoading, reload: reloadPet } = useActivePet(token);
  const isOwner = isPetOwner(pet?.ownerUserId, user?._id);
  const { members, setMembers, loading: membersLoading, error: membersError, reload: reloadMembers } =
    usePetMembers(token, pet?._id ?? null, isOwner);
  const { showErrorToast } = useToast();

  useEffect(() => {
    if (membersError) {
      showErrorToast(membersError);
    }
  }, [membersError, showErrorToast]);

  const { canViewJournal, ownerName } = usePetPermissions(token, pet, user?._id);
  const [journalVisible, setJournalVisible] = useState(false);

  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const [invite, setInvite] = useState<GenerateInviteResponse | null>(null);
  const [guestMembers, setGuestMembers] = useState<FamilyMemberDisplay[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionsVisible, setPermissionsVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<PetMemberRow | null>(null);
  const guestScopeKey =
    token && pet?._id && !isOwner ? `${token}:${pet._id}:guest` : null;
  const { shouldBlockUI: shouldBlockGuestUI, markLoaded: markGuestLoaded, reset: resetGuestScope } =
    useStaleLoadScope(guestScopeKey);

  const [dbPremium, setDbPremium] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchPremiumStatus(token)
      .then((res) => {
        setDbPremium(res.isPremium);
      })
      .catch(() => {});
  }, [token]);

  const manageableMemberIds = useMemo(
    () => members.map((member) => member.userId._id),
    [members],
  );

  const isPremium = dbPremium ?? (user?.premiumStatus === 'premium');
  const canInvite = Boolean(pet?._id && token && isOwner && isPremium);

  const userName = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? null;
  const familyName = isOwner
    ? (userName ? `${userName}'s Family` : 'Your Family')
    : (ownerName ? `${ownerName}'s Family` : 'Shared Family');
  const displayMembers = useMemo(() => {
    if (!user) return [];
    if (isOwner) {
      return buildFamilyMembersList(user, members);
    }
    return guestMembers;
  }, [user, isOwner, members, guestMembers]);

  const [guestPermissions, setGuestPermissions] = useState<any | null>(null);

  const loadGuestAccess = useCallback(async () => {
    if (!token || !pet?._id || pet._id === 'fallback-pet-id-123' || isOwner || !user) {
      resetGuestScope();
      setGuestMembers([]);
      setGuestPermissions(null);
      return;
    }

    const block = shouldBlockGuestUI();
    if (block) setGuestLoading(true);

    try {
      const perms = await fetchPetPermissions(token, pet._id);
      setGuestPermissions(perms);
      setGuestMembers([
        buildGuestMemberDisplay(
          user,
          perms.allowedModules ?? [],
          perms.accessLevel,
          perms.ownerName || ownerName,
        ),
      ]);
      markGuestLoaded();
    } catch {
      if (block) {
        setGuestMembers([
          buildGuestMemberDisplay(user, [], 'readonly', ownerName),
        ]);
      }
    } finally {
      setGuestLoading(false);
    }
  }, [token, pet?._id, isOwner, user, shouldBlockGuestUI, markGuestLoaded, resetGuestScope, ownerName]);

  useEffect(() => {
    loadGuestAccess();

    // Poll guest access permissions every 5 seconds to keep view in sync
    const intervalId = setInterval(() => {
      void loadGuestAccess();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadGuestAccess]);

  useEffect(() => {
    const loadDefaultInvite = async () => {
      if (!token || !pet?._id || pet._id === 'fallback-pet-id-123' || !isOwner || !isPremium) return;
      try {
        const data = await generatePetInvite(token, {
          petId: pet._id,
          accessLevel: 'edit',
          allowedModules: ['feeding', 'walks', 'medicine', 'grooming', 'vaccination', 'journal', 'expenses'],
        });
        setInvite(data);
      } catch {
        // Silently ignore
      }
    };
    loadDefaultInvite();
  }, [token, pet?._id, isOwner, isPremium]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (token) {
        const res = await fetchPremiumStatus(token);
        setDbPremium(res.isPremium);
      }
    } catch {
      // ignore
    }
    await Promise.all([reloadPet(), reloadMembers(), loadGuestAccess()]);
    setRefreshing(false);
  }, [token, reloadPet, reloadMembers, loadGuestAccess]);

  const handleShareCode = useCallback(async () => {
    if (!invite) return;
    const webLink = resolveInviteWebLink(invite);
    const appLink = resolveInviteAppLink(invite);
    try {
      await Share.share({ message: buildInviteShareMessage(invite, webLink, appLink) });
    } catch {
      // User dismissed share sheet.
    }
  }, [invite]);

  const joinCode = invite ? formatJoinCode(invite.inviteToken) : null;

  return (
    <View style={styles.container}>
      <FamilyHubHeader
        notificationCount={notificationCount}
        onNotificationsPress={onNotificationsPress}
        onJournalPress={canViewJournal ? () => setJournalVisible(true) : undefined}
        showJournal={canViewJournal}
        isPremium={isPremium}
        topInset={insets.top}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={HomeTheme.cardGreen}
          />
        }
      >
        {petLoading && !pet ? (
          <View style={styles.skeletonWrap}>
            <SkeletonFamilyHub />
          </View>
        ) : null}

        {!petLoading && !pet ? (
          <View style={styles.bannerWrap}>
            <AuthInfoBanner message="Add a pet from the Home tab to set up your Family Hub and invite caregivers." />
          </View>
        ) : null}

        {pet && !isOwner ? (
          <View style={styles.bannerWrap}>
            <AuthInfoBanner message="Only the pet owner can invite members and manage family access." />
          </View>
        ) : null}

        {pet ? (
          <>
            <FamilyOverviewCard
              familyName={familyName}
              memberCount={displayMembers.length}
              petCount={1}
              isPremium={isPremium}
              joinCode={joinCode}
              loadingInvite={false}
              canInvite={canInvite}
              showInviteSection={isOwner}
              onShareCode={handleShareCode}
              onInvitePress={() => setInviteSheetVisible(true)}
            />

            {!isPremium && isOwner ? (
              <View style={styles.bannerWrap}>
                <AuthInfoBanner message="Upgrade to Premium to generate invite links and add family members to care for your pet." />
              </View>
            ) : null}

            <MembersListSection
              members={displayMembers}
              loading={(membersLoading && isOwner) || (guestLoading && !isOwner)}
              manageableIds={isOwner ? manageableMemberIds : []}
              isPremium={isPremium}
              isOwner={isOwner}
              hostName={ownerName}
              currentUserId={user?._id}
              onMemberSettingsPress={(memberId) => {
                if (isOwner) {
                  const row = members.find((member) => member.userId._id === memberId);
                  if (row) {
                    setSelectedMember(row);
                    setPermissionsVisible(true);
                  }
                } else if (user && memberId === user._id) {
                  const clickedMemberRow = displayMembers.find((m) => m.id === memberId);
                  const secureMemberPayload = {
                    ...clickedMemberRow,
                    userId: {
                      _id: user._id,
                      fullName: user.fullName,
                      email: user.email,
                      profileImage: user.profileImage,
                    },
                    id: clickedMemberRow?.id || (clickedMemberRow as any)?._id || guestPermissions?.member?.id || user._id,
                    permissions: guestPermissions?.member?.permissions || (clickedMemberRow as any)?.permissions || guestPermissions?.permissions,
                    allowedModules: guestPermissions?.member?.allowedModules || (clickedMemberRow as any)?.allowedModules || guestPermissions?.allowedModules || [],
                    accessLevel: guestPermissions?.member?.accessLevel || guestPermissions?.accessLevel || 'readonly',
                  };

                  console.log("EMERGENCY_MODAL_PAYLOAD_CHECK:", secureMemberPayload);

                  setSelectedMember(secureMemberPayload as any);
                  setPermissionsVisible(true);
                }
              }}
            />
          </>
        ) : null}
      </ScrollView>

      <InviteFamilySheet
        visible={inviteSheetVisible}
        onClose={() => setInviteSheetVisible(false)}
        petId={pet?._id ?? null}
        token={token}
        isPremium={isPremium}
        onInviteGenerated={(generated) => {
          setInvite(generated);
        }}
      />

      <MemberPermissionsSheet
        visible={permissionsVisible}
        member={selectedMember}
        petId={pet?._id ?? null}
        token={token}
        isPremium={isPremium}
        isReadOnly={!isOwner}
        onClose={() => {
          setPermissionsVisible(false);
          setSelectedMember(null);
        }}
        onUpdated={(updatedOrDeletedMember) => {
          if (typeof updatedOrDeletedMember === 'string') {
            setMembers((prev) => prev.filter((m) => (m.userId?._id || (m as any).id) !== updatedOrDeletedMember));
          } else if (updatedOrDeletedMember && typeof updatedOrDeletedMember === 'object') {
            setMembers((prev) =>
              prev.map((m) =>
                m.userId._id === updatedOrDeletedMember.userId._id
                  ? updatedOrDeletedMember
                  : m
              )
            );
            void reloadMembers(true);
          } else {
            void reloadMembers(true);
          }
        }}
      />

      <LogJournalSheet
        visible={journalVisible}
        onClose={() => setJournalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F7F1', // Soft green background
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  bannerWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
  },
});
