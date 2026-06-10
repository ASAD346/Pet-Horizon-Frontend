import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { CreateFamilyHubSheet } from '@/components/family/CreateFamilyHubSheet';
import { EmailInviteSheet } from '@/components/family/EmailInviteSheet';
import { FamilyHubHeader } from '@/components/family/FamilyHubHeader';
import { FamilyHubMemberSheet } from '@/components/family/FamilyHubMemberSheet';
import { FamilyOverviewCard } from '@/components/family/FamilyOverviewCard';
import { InviteFamilySheet } from '@/components/family/InviteFamilySheet';
import { MemberPermissionsSheet } from '@/components/family/MemberPermissionsSheet';
import { MembersListSection } from '@/components/family/MembersListSection';
import { HomeTheme, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePet } from '@/hooks/useActivePet';
import { useFamilyHub } from '@/hooks/useFamilyHub';
import { useNotifications } from '@/hooks/useNotifications';
import { usePetMembers } from '@/hooks/usePetMembers';
import {
  buildFamilyHubMembersList,
  buildFamilyMembersList,
  buildGuestMemberDisplay,
  formatJoinCode,
  isFamilyAdmin,
  isPetOwner,
} from '@/lib/family/formatters';
import { getErrorMessage } from '@/lib/api/errors';
import { generatePetInvite } from '@/services/family/familyApi';
import { fetchPetPermissions } from '@/services/schedules/feedingApi';
import type {
  FamilyHubMemberRow,
  FamilyMemberDisplay,
  GenerateInviteResponse,
  PetMemberRow,
} from '@/types/family';

const TAB_BAR_CLEARANCE = 100;

export function FamilyHubView() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { pet, loading: petLoading, reload: reloadPet } = useActivePet(token);
  const { unreadCount } = useNotifications(token);

  const isOwner = isPetOwner(pet?.ownerUserId, user?._id);
  const {
    familyId,
    familyName,
    members: hubMembers,
    familyPets,
    loading: hubLoading,
    creating,
    error: hubError,
    reload: reloadHub,
    createFamilyHub,
    removeFamilyHub,
  } = useFamilyHub(token, user?._id, pet?._id);

  const isHubAdmin = isFamilyAdmin(hubMembers, user?._id);
  const hasFamilyHub = Boolean(familyId);

  const { members: petMembers, loading: petMembersLoading, error: petMembersError, reload: reloadPetMembers } =
    usePetMembers(token, pet?._id ?? null, isOwner && !hasFamilyHub);

  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const [emailInviteVisible, setEmailInviteVisible] = useState(false);
  const [createHubVisible, setCreateHubVisible] = useState(false);
  const [createHubError, setCreateHubError] = useState<string | null>(null);
  const [invite, setInvite] = useState<GenerateInviteResponse | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [guestMembers, setGuestMembers] = useState<FamilyMemberDisplay[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [petPermissionsVisible, setPetPermissionsVisible] = useState(false);
  const [selectedPetMember, setSelectedPetMember] = useState<PetMemberRow | null>(null);

  const [hubMemberVisible, setHubMemberVisible] = useState(false);
  const [selectedHubMember, setSelectedHubMember] = useState<FamilyHubMemberRow | null>(null);

  const isPremium = user?.premiumStatus === 'premium';
  const canLinkInvite = Boolean(pet?._id && token && isOwner && isPremium);

  const displayName = hasFamilyHub
    ? familyName ?? 'Family Hub'
    : pet?.name
      ? `${pet.name}'s Family 🐾`
      : 'Your Family';

  const hubDisplayMembers = useMemo(
    () => buildFamilyHubMembersList(hubMembers, user?._id),
    [hubMembers, user?._id],
  );

  const petDisplayMembers = useMemo(() => {
    if (!user) return [];
    if (isOwner) return buildFamilyMembersList(user, petMembers);
    return guestMembers;
  }, [user, isOwner, petMembers, guestMembers]);

  const displayMembers = hasFamilyHub ? hubDisplayMembers : petDisplayMembers;
  const membersLoading = hasFamilyHub ? hubLoading : (petMembersLoading && isOwner) || (guestLoading && !isOwner);
  const membersError = hasFamilyHub ? hubError : petMembersError;

  const manageableMemberIds = useMemo(() => {
    if (hasFamilyHub) {
      return hubMembers
        .filter((member) => member.role !== 'admin' && member.userId._id !== user?._id)
        .map((member) => member.userId._id);
    }
    return petMembers.map((member) => member.userId._id);
  }, [hasFamilyHub, hubMembers, petMembers, user?._id]);

  const loadGuestAccess = useCallback(async () => {
    if (!token || !pet?._id || isOwner || !user || hasFamilyHub) {
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
      setGuestMembers([buildGuestMemberDisplay(user, [], 'readonly')]);
    } finally {
      setGuestLoading(false);
    }
  }, [token, pet?._id, isOwner, user, hasFamilyHub]);

  const loadInvitePreview = useCallback(async () => {
    if (!canLinkInvite || !pet?._id || !token) {
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
  }, [canLinkInvite, pet?._id, token]);

  useEffect(() => {
    loadInvitePreview();
  }, [loadInvitePreview]);

  useEffect(() => {
    loadGuestAccess();
  }, [loadGuestAccess]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      reloadPet(),
      reloadHub(),
      reloadPetMembers(),
      loadInvitePreview(),
      loadGuestAccess(),
    ]);
    setRefreshing(false);
  }, [reloadPet, reloadHub, reloadPetMembers, loadInvitePreview, loadGuestAccess]);

  const handleShareCode = useCallback(async () => {
    if (!invite) return;
    try {
      await Share.share({ message: invite.shareText });
    } catch {
      // User dismissed share sheet.
    }
  }, [invite]);

  const handleCreateHub = async (name: string) => {
    setCreateHubError(null);
    try {
      await createFamilyHub(name);
      setCreateHubVisible(false);
    } catch (err) {
      setCreateHubError(getErrorMessage(err));
    }
  };

  const handleDeleteHub = () => {
    if (!isHubAdmin) return;
    Alert.alert(
      'Delete family hub',
      'This removes the email-based family hub and all hub members. Pet link invites are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFamilyHub();
            } catch (err) {
              Alert.alert('Family hub', getErrorMessage(err));
            }
          },
        },
      ],
    );
  };

  const handleMemberSettings = (memberId: string) => {
    if (hasFamilyHub) {
      const row = hubMembers.find((member) => member.userId._id === memberId);
      if (row) {
        setSelectedHubMember(row);
        setHubMemberVisible(true);
      }
      return;
    }
    const row = petMembers.find((member) => member.userId._id === memberId);
    if (row) {
      setSelectedPetMember(row);
      setPetPermissionsVisible(true);
    }
  };

  const joinCode = invite ? formatJoinCode(invite.inviteToken) : null;
  const canManageMembers = hasFamilyHub ? isHubAdmin : isOwner;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FamilyHubHeader notificationCount={unreadCount} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={HomeTheme.cardGreen}
          />
        }
      >
        {petLoading && !pet && !hasFamilyHub ? (
          <ActivityIndicator color={HomeTheme.cardGreen} style={styles.centerLoader} />
        ) : null}

        {!petLoading && !pet && !hasFamilyHub ? (
          <View style={styles.bannerWrap}>
            <AuthInfoBanner message="Add a pet from Home to manage your family hub and invite caregivers." />
          </View>
        ) : null}

        {pet && !isOwner && !hasFamilyHub ? (
          <View style={styles.bannerWrap}>
            <AuthInfoBanner message="Only the pet owner can invite members via link. Family hub admins manage email invites." />
          </View>
        ) : null}

        {hasFamilyHub ? (
          <View style={styles.bannerWrap}>
            <AuthInfoBanner message="Email family hub is active. Use Invite by Email for caregivers, or link/QR for quick pet access." />
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

        {pet || hasFamilyHub ? (
          <>
            <FamilyOverviewCard
              familyName={displayName}
              memberCount={displayMembers.length}
              petCount={hasFamilyHub ? familyPets.length || 1 : 1}
              isPremium={isPremium}
              joinCode={joinCode}
              loadingInvite={inviteLoading}
              canInvite={canLinkInvite}
              showInviteSection={isOwner}
              hasFamilyHub={hasFamilyHub}
              onShareCode={handleShareCode}
              onInvitePress={() => setInviteSheetVisible(true)}
              onEmailInvitePress={() => setEmailInviteVisible(true)}
              onCreateHubPress={() => setCreateHubVisible(true)}
            />

            {!isPremium && isOwner ? (
              <View style={styles.bannerWrap}>
                <AuthInfoBanner message="Upgrade to Pro for link invites and email family hub." />
              </View>
            ) : null}

            {hasFamilyHub && isHubAdmin && familyPets.length === 0 ? (
              <View style={styles.bannerWrap}>
                <AuthInfoBanner message="Email invites require pets in the family hub. Add a pet with your hub when registering." />
                <TouchableOpacity
                  style={styles.addPetLink}
                  onPress={() =>
                    router.push({
                      pathname: '/pet/register',
                      params: { mode: 'add', familyId: familyId ?? '' },
                    } as Href)
                  }
                >
                  <AppText variant="bodySmall" weight="700" color={HomeTheme.cardGreen}>
                    Add family hub pet
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : null}

            <MembersListSection
              members={displayMembers}
              loading={membersLoading}
              manageableIds={canManageMembers ? manageableMemberIds : []}
              onMemberSettingsPress={handleMemberSettings}
            />

            {hasFamilyHub && isHubAdmin ? (
              <TouchableOpacity style={styles.deleteHubBtn} onPress={handleDeleteHub}>
                <Ionicons name="trash-outline" size={18} color="#C62828" />
                <AppText variant="bodySmall" weight="700" color="#C62828">
                  Delete Family Hub
                </AppText>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <InviteFamilySheet
        visible={inviteSheetVisible}
        onClose={() => setInviteSheetVisible(false)}
        petId={pet?._id ?? null}
        token={token}
        onInviteGenerated={(data) => setInvite(data)}
      />

      <EmailInviteSheet
        visible={emailInviteVisible}
        familyId={familyId}
        token={token}
        familyPets={familyPets}
        onClose={() => setEmailInviteVisible(false)}
        onInvited={reloadHub}
      />

      <CreateFamilyHubSheet
        visible={createHubVisible}
        defaultName={pet?.name ? `${pet.name}'s Family` : 'My Family Hub'}
        saving={creating}
        error={createHubError}
        onClose={() => {
          setCreateHubVisible(false);
          setCreateHubError(null);
        }}
        onCreate={handleCreateHub}
      />

      <MemberPermissionsSheet
        visible={petPermissionsVisible}
        member={selectedPetMember}
        petId={pet?._id ?? null}
        token={token}
        onClose={() => {
          setPetPermissionsVisible(false);
          setSelectedPetMember(null);
        }}
        onUpdated={reloadPetMembers}
      />

      <FamilyHubMemberSheet
        visible={hubMemberVisible}
        member={selectedHubMember}
        familyId={familyId}
        familyPets={familyPets}
        token={token}
        onClose={() => {
          setHubMemberVisible(false);
          setSelectedHubMember(null);
        }}
        onUpdated={reloadHub}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HomeTheme.background,
  },
  scrollContent: {
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  bannerWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  centerLoader: {
    marginVertical: Spacing.xl,
  },
  addPetLink: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  deleteHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
  },
});
