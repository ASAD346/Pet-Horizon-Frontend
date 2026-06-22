import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { FamilyHubHeader } from '@/components/family/FamilyHubHeader';
import { FamilyOverviewCard } from '@/components/family/FamilyOverviewCard';
import { InviteFamilySheet } from '@/components/family/InviteFamilySheet';
import { MemberPermissionsSheet } from '@/components/family/MemberPermissionsSheet';
import { MembersListSection } from '@/components/family/MembersListSection';
import { HomeTheme, Spacing } from '@/constants/theme';
import { SkeletonFamilyOverviewCard } from '@/components/ui/skeletons';
import { useStaleLoadScope } from '@/hooks/useStaleLoadScope';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePetMembers } from '@/hooks/usePetMembers';
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
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { notificationCount, onNotificationsPress } = useTabHeaderActions();
  const { token, user } = useAuth();
  const { pet, loading: petLoading, reload: reloadPet } = useActivePet(token);
  const isOwner = isPetOwner(pet?.ownerUserId, user?._id);
  const { members, loading: membersLoading, error: membersError, reload: reloadMembers } =
    usePetMembers(token, pet?._id ?? null, isOwner);

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

  const manageableMemberIds = useMemo(
    () => members.map((member) => member.userId._id),
    [members],
  );

  const isPremium = user?.premiumStatus === 'premium';
  const canInvite = Boolean(pet?._id && token && isOwner && isPremium);

  const familyName = pet?.name ? `${pet.name}'s Family 🐾` : 'Your Family';
  const displayMembers = useMemo(() => {
    if (!user) return [];
    if (isOwner) {
      return buildFamilyMembersList(user, members);
    }
    return guestMembers;
  }, [user, isOwner, members, guestMembers]);

  const loadGuestAccess = useCallback(async () => {
    if (!token || !pet?._id || isOwner || !user) {
      resetGuestScope();
      setGuestMembers([]);
      return;
    }

    const block = shouldBlockGuestUI();
    if (block) setGuestLoading(true);

    try {
      const perms = await fetchPetPermissions(token, pet._id);
      setGuestMembers([
        buildGuestMemberDisplay(user, perms.allowedModules ?? [], perms.accessLevel),
      ]);
      markGuestLoaded();
    } catch {
      if (block) {
        setGuestMembers([
          buildGuestMemberDisplay(user, [], 'readonly'),
        ]);
      }
    } finally {
      setGuestLoading(false);
    }
  }, [token, pet?._id, isOwner, user, shouldBlockGuestUI, markGuestLoaded, resetGuestScope]);

  useEffect(() => {
    loadGuestAccess();
  }, [loadGuestAccess]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([reloadPet(), reloadMembers(), loadGuestAccess()]);
    setRefreshing(false);
  }, [reloadPet, reloadMembers, loadGuestAccess]);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <FamilyHubHeader
        notificationCount={notificationCount}
        onNotificationsPress={onNotificationsPress}
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
            <SkeletonFamilyOverviewCard />
          </View>
        ) : null}

        {!petLoading && !pet ? (
          <View style={styles.bannerWrap}>
            <AuthInfoBanner message="Add a pet from Home to manage your family hub and invite caregivers." />
          </View>
        ) : null}

        {pet && !isOwner ? (
          <View style={styles.bannerWrap}>
            <AuthInfoBanner message="Only the pet owner can invite members and manage family access." />
          </View>
        ) : null}

        {membersError ? (
          <View style={styles.bannerWrap}>
            <AuthErrorBanner message={membersError} />
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
                <AuthInfoBanner message="Upgrade to Pro to generate invite links and add family members." />
              </View>
            ) : null}

            <MembersListSection
              members={displayMembers}
              loading={(membersLoading && isOwner) || (guestLoading && !isOwner)}
              manageableIds={isOwner ? manageableMemberIds : []}
              onMemberSettingsPress={(memberId) => {
                const row = members.find((member) => member.userId._id === memberId);
                if (row) {
                  setSelectedMember(row);
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
        onInviteGenerated={(generated) => {
          setInvite(generated);
        }}
      />

      <MemberPermissionsSheet
        visible={permissionsVisible}
        member={selectedMember}
        petId={pet?._id ?? null}
        token={token}
        onClose={() => {
          setPermissionsVisible(false);
          setSelectedMember(null);
        }}
        onUpdated={reloadMembers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HomeTheme.background,
  },
  scrollContent: {},
  bannerWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
  },
});
