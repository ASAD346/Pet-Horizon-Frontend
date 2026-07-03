import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/hooks/useToast';
import { FamilyHubHeader } from './FamilyHubHeader';
import { FamilyOverviewCard } from '@/components/family/FamilyOverviewCard';
import { InviteFamilySheet } from '@/components/family/InviteFamilySheet';
import { MemberPermissionsSheet } from '@/components/family/MemberPermissionsSheet';
import { MembersListSection } from '@/components/family/MembersListSection';
import { HomeTheme, Spacing, Radius } from '@/constants/theme';
import { SkeletonFamilyHub } from '@/components/ui/skeletons';
import { useStaleLoadScope } from '@/hooks/useStaleLoadScope';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePetMembers } from '@/hooks/usePetMembers';
import { usePetPermissions } from '@/hooks/usePetPermissions';
import { usePetContext } from '@/hooks/usePetContext';
import { LogJournalSheet } from '@/components/journal';
import { QrScannerModal } from '@/components/family/QrScannerModal';
import { AcceptInviteModal } from '@/components/family/AcceptInviteModal';
import { generatePetInvite } from '@/services/family/familyApi';
import { fetchPremiumStatus } from '@/services/premium/premiumApi';
import { AppBrandModal } from '@/components/ui/AppBrandModal';
import {
  buildFamilyMembersList,
  buildGuestMemberDisplay,
  formatJoinCode,
  isPetOwner,
  mapModuleNameToLabel,
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
import { useRouter } from 'expo-router';

export function FamilyHubView() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { notificationCount, onNotificationsPress } = useTabHeaderActions();
  const { token, user } = useAuth();
  const { activePetId } = usePetContext();
  const { pet, loading: petLoading, reload: reloadPet } = useActivePet(token);
  const isOwner = isPetOwner(pet?.ownerUserId, user?._id);
  const { members, setMembers, loading: membersLoading, error: membersError, reload: reloadMembers } =
    usePetMembers(token, activePetId ?? pet?._id ?? null, true);
  const { showErrorToast } = useToast();

  useEffect(() => {
    if (membersError) {
      showErrorToast(membersError);
    }
  }, [membersError, showErrorToast]);

  const { canViewJournal, ownerName, allowedModules = [] } = usePetPermissions(token, pet, user?._id);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [journalVisible, setJournalVisible] = useState(false);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);

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
    if (!user || !pet) return [];
    const ownerUser = isOwner
      ? user
      : ({
          _id: pet.ownerUserId || '',
          fullName: ownerName || 'Owner',
          email: '',
          profileImage: undefined,
        } as any);
    return buildFamilyMembersList(ownerUser, members);
  }, [user, pet, members, isOwner, ownerName]);

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
              loading={membersLoading || guestLoading}
              manageableIds={isOwner ? manageableMemberIds : []}
              isPremium={isPremium}
              isOwner={isOwner}
              hostName={ownerName}
              currentUserId={user?._id}
              allowedModules={allowedModules}
              onInfoPress={() => setInfoModalVisible(true)}
              onMemberSettingsPress={(memberId) => {
                const found = members.find(
                  (m) => String(m.userId?._id || (m as any).id || (m as any)._id) === String(memberId)
                );
                if (found) {
                  setSelectedMember(found);
                  setPermissionsVisible(true);
                }
              }}
            />

            {/* Join another family workspace via QR scan */}
            <TouchableOpacity
              style={styles.joinFamilyCard}
              onPress={() => setQrScannerVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.joinIconBg}>
                <Ionicons name="qr-code-outline" size={24} color="#3A8F3B" />
              </View>
              <View style={styles.joinTextContainer}>
                <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                  Join Another Family
                </AppText>
                <AppText variant="caption" color={HomeTheme.textMuted}>
                  Scan a QR invitation to co-manage another pet.
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={HomeTheme.textMuted} />
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>

      <InviteFamilySheet
        visible={inviteSheetVisible}
        onClose={() => setInviteSheetVisible(false)}
        petId={activePetId}
        token={token}
        isPremium={isPremium}
        onInviteGenerated={(generated) => {
          setInvite(generated);
        }}
      />

      <MemberPermissionsSheet
        visible={permissionsVisible}
        member={selectedMember}
        petId={activePetId}
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
            void reloadMembers(true);
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

      <QrScannerModal
        visible={qrScannerVisible}
        onClose={() => setQrScannerVisible(false)}
        onScanSuccess={(scannedToken) => {
          setQrScannerVisible(false);
          setScannedToken(scannedToken);
          setAcceptModalVisible(true);
        }}
      />

      <AcceptInviteModal
        visible={acceptModalVisible}
        inviteToken={scannedToken}
        onClose={() => {
          setAcceptModalVisible(false);
          setScannedToken(null);
        }}
        onSuccess={() => {
          // On success, reload members lists in-place
          if (reloadMembers) void reloadMembers(true);
          if (reloadPet) void reloadPet();
        }}
      />

      <AppBrandModal
        visible={infoModalVisible}
        title="Your Guest Access"
        message={`As a guest member, you have edit access for the following modules:\n\n${
          allowedModules && allowedModules.length > 0
            ? allowedModules.map((m) => `• ${mapModuleNameToLabel(m)}`).join('\n')
            : '• None (View Only Access)'
        }\n\nAll other modules are view-only.`}
        confirmLabel="Got it"
        onConfirm={() => setInfoModalVisible(false)}
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
  joinFamilyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    gap: Spacing.md,
  },
  joinIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTextContainer: {
    flex: 1,
    gap: 2,
  },
});
