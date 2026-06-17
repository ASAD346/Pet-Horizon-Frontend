import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '@/contexts/AuthContext';
import { useActivePet } from '@/hooks/useActivePet';
import { usePetMembers } from '@/hooks/usePetMembers';
import {
  buildFamilyMembersList,
  buildGuestMemberDisplay,
  formatJoinCode,
  isPetOwner,
} from '@/lib/family/formatters';
import { getErrorMessage } from '@/lib/api/errors';
import { generatePetInvite } from '@/services/family/familyApi';
import { fetchPetPermissions } from '@/services/schedules/feedingApi';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import type { FamilyMemberDisplay, GenerateInviteResponse, PetMemberRow } from '@/types/family';

export function FamilyHubView() {
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token, user } = useAuth();
  const { pet, loading: petLoading, reload: reloadPet } = useActivePet(token);
  const isOwner = isPetOwner(pet?.ownerUserId, user?._id);
  const { members, loading: membersLoading, error: membersError, reload: reloadMembers } =
    usePetMembers(token, pet?._id ?? null, isOwner);

  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const [invite, setInvite] = useState<GenerateInviteResponse | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [guestMembers, setGuestMembers] = useState<FamilyMemberDisplay[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionsVisible, setPermissionsVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<PetMemberRow | null>(null);

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
      setGuestMembers([]);
      return;
    }

    setGuestLoading(true);
    try {
      const perms = await fetchPetPermissions(token, pet._id);
      setGuestMembers([
        buildGuestMemberDisplay(user, perms.allowedModules ?? [], perms.accessLevel),
      ]);
    } catch {
      setGuestMembers([
        buildGuestMemberDisplay(user, [], 'readonly'),
      ]);
    } finally {
      setGuestLoading(false);
    }
  }, [token, pet?._id, isOwner, user]);

  const loadInvitePreview = useCallback(async () => {
    if (!canInvite || !pet?._id || !token) {
      setInvite(null);
      setInviteError(null);
      return;
    }

    setInviteLoading(true);
    setInviteError(null);
    try {
      const data = await generatePetInvite(token, { petId: pet._id });
      setInvite(data);
    } catch (err) {
      setInvite(null);
      setInviteError(getErrorMessage(err));
    } finally {
      setInviteLoading(false);
    }
  }, [canInvite, pet?._id, token]);

  useEffect(() => {
    loadInvitePreview();
  }, [loadInvitePreview]);

  useEffect(() => {
    loadGuestAccess();
  }, [loadGuestAccess]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([reloadPet(), reloadMembers(), loadInvitePreview(), loadGuestAccess()]);
    setRefreshing(false);
  }, [reloadPet, reloadMembers, loadInvitePreview, loadGuestAccess]);

  const handleShareCode = useCallback(async () => {
    if (!invite) return;
    try {
      await Share.share({ message: invite.shareText });
    } catch {
      // User dismissed share sheet.
    }
  }, [invite]);

  const joinCode = invite ? formatJoinCode(invite.inviteToken) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FamilyHubHeader notificationCount={3} />

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
          <ActivityIndicator color={HomeTheme.cardGreen} style={styles.centerLoader} />
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

        {inviteError ? (
          <View style={styles.bannerWrap}>
            <AuthErrorBanner message={inviteError} />
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
              loadingInvite={inviteLoading}
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
        cachedInvite={invite}
        onInviteGenerated={setInvite}
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
  centerLoader: {
    marginVertical: Spacing.xl,
  },
});
