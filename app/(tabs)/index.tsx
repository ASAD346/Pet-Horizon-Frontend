import React, { useMemo, useState } from 'react';

import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { useRouter, type Href } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
    HomeHeader,

    PetProfileCard,

    QuickActionsSection,

    RecentActivitySection,

    GroomingAlertsRow,

    PetBirthdayBanner,

    TodaysScheduleSection,

    UpNextSection,
} from '@/components/home';

import { useAuth } from '@/hooks/useAuth';

import { useActivePet } from '@/hooks/useActivePet';

import { useDashboardStatus } from '@/hooks/useDashboardStatus';

import { useNotifications } from '@/hooks/useNotifications';

import { usePetPermissions } from '@/hooks/usePetPermissions';

import { usePets } from '@/hooks/usePets';

import { useUpcomingTasks } from '@/hooks/useUpcomingTasks';

import { PetSwitcherSheet } from '@/components/pet/PetSwitcherSheet';

import { useFeedingSchedules } from '@/hooks/useFeedingSchedules';

import { useWalkSchedules } from '@/hooks/useWalkSchedules';

import { useMedicineSchedules } from '@/hooks/useMedicineSchedules';

import { useGroomingRecords } from '@/hooks/useGroomingRecords';

import { useVaccinationSchedules } from '@/hooks/useVaccinationSchedules';

import { resolveMediaUrl } from '@/lib/mediaUrl';

import { activatePetSession } from '@/lib/pet/activatePetSession';
import { isBirthdayToday } from '@/lib/pet/birthdayUtils';
import { dashboardTaskModule } from '@/lib/pet/petPermissionAccess';

import { petToProfileProps } from '@/services/pets/petDisplay';

import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';

import { LogFoodSheet } from '@/components/log-food';

import { LogGroomingSheet } from '@/components/log-grooming';

import { GroomingManageSheet } from '@/components/log-grooming/GroomingManageSheet';

import { LogJournalSheet } from '@/components/journal';

import { LogMedicineSheet } from '@/components/log-medicine';

import { LogWalkSheet } from '@/components/log-walk';

import { LogVaccinationSheet } from '@/components/log-vaccination';

import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { canAddAnotherPet } from '@/lib/premium/canAddPet';
import { HomeTheme, Spacing } from '@/constants/theme';
import { SkeletonScreenLayout } from '@/components/ui/skeletons';
import { LoginHeaderDecor } from '@/components/auth/login';

import type { GroomingRecord } from '@/types/grooming';



function formatDateLabel(date: Date): string {

  return date.toLocaleDateString('en-US', {

    weekday: 'long',

    month: 'long',

    day: 'numeric',

  });

}



export default function HomeScreen() {
  const { clearance: tabBarClearance } = useTabBarLayout();

  const router = useRouter();

  const { token, user, setSession } = useAuth();

  const { pet, loading, reload: reloadPet } = useActivePet(token);

  const {
    canView,
    canEdit,
    canViewJournal,
    isOwner,
    accessBannerMessage,
  } = usePetPermissions(token, pet, user?._id);

  const { profileStats, status: dashboardStatus } = useDashboardStatus(token);

  const { tasks: dashboardTasks, loading: tasksLoading } = useUpcomingTasks(token);

  const { unreadCount } = useNotifications(token);

  const { pets, switchingId, switchPet, reload: reloadPets } = usePets(
    token,
    pet?._id ?? user?.activePetId,
    user?._id,
  );



  const {

    schedules: feedingSchedules,

    loading: feedingLoading,

    actionId: feedingActionId,

    reload: reloadFeeding,

    completeFeeding,

    skipFeeding,

  } = useFeedingSchedules(token, pet?._id);



  const {

    schedules: walkSchedules,

    loading: walkLoading,

    actionId: walkActionId,

    reload: reloadWalks,

    completeWalk,

  } = useWalkSchedules(token, pet?._id);



  const {

    schedules: medicineSchedules,

    loading: medicineLoading,

    actionId: medicineActionId,

    reload: reloadMedicine,

    completeMedicine,

  } = useMedicineSchedules(token, pet?._id);



  const {

    records: groomingRecords,

    groomingVisible,

    loading: groomingLoading,

    actionId: groomingActionId,

    reload: reloadGrooming,

    completeGrooming,

  } = useGroomingRecords(token, pet?._id);



  const {

    schedules: vaccinationSchedules,

    loading: vaccinationLoading,

    actionId: vaccinationActionId,

    reload: reloadVaccination,

    completeVaccination,

  } = useVaccinationSchedules(token, pet?._id);



  const scheduleLoading = feedingLoading || walkLoading || medicineLoading || groomingLoading || vaccinationLoading || tasksLoading;

  const visibleFeedingSchedules = canView('feeding') ? feedingSchedules : [];
  const visibleWalkSchedules = canView('walks') ? walkSchedules : [];
  const visibleMedicineSchedules = canView('medicine') ? medicineSchedules : [];
  const visibleGroomingRecords = canView('grooming') ? groomingRecords : [];
  const visibleVaccinationSchedules = canView('vaccination') ? vaccinationSchedules : [];

  const visibleDashboardTasks = useMemo(() => {
    const activeScheduleIds = new Set<string>();
    visibleFeedingSchedules.forEach((s: any) => {
      if (s._id) activeScheduleIds.add(s._id);
      if (s.id) activeScheduleIds.add(s.id);
    });
    visibleWalkSchedules.forEach((s: any) => {
      if (s._id) activeScheduleIds.add(s._id);
      if (s.id) activeScheduleIds.add(s.id);
    });
    visibleMedicineSchedules.forEach((s: any) => {
      if (s._id) activeScheduleIds.add(s._id);
      if (s.id) activeScheduleIds.add(s.id);
    });
    visibleGroomingRecords.forEach((s: any) => {
      if (s._id) activeScheduleIds.add(s._id);
      if (s.id) activeScheduleIds.add(s.id);
    });
    visibleVaccinationSchedules.forEach((s: any) => {
      if (s._id) activeScheduleIds.add(s._id);
      if (s.id) activeScheduleIds.add(s.id);
    });

    return dashboardTasks.filter((task) => {
      if (activeScheduleIds.has(task.id)) {
        return false;
      }
      const moduleId = dashboardTaskModule(task);
      return moduleId ? canView(moduleId) : false;
    });
  }, [
    dashboardTasks,
    canView,
    visibleFeedingSchedules,
    visibleWalkSchedules,
    visibleMedicineSchedules,
    visibleGroomingRecords,
    visibleVaccinationSchedules,
  ]);



  const profile = useMemo(() => {
    if (profileStats && dashboardStatus?.petId === pet?._id) return profileStats;
    if (pet) return petToProfileProps(pet);
    if (profileStats) return profileStats;
    return null;
  }, [pet, profileStats, dashboardStatus?.petId]);

  const petImageUrl = resolveMediaUrl(
    dashboardStatus?.petId === pet?._id ? profileStats?.photoUrl ?? pet?.image : pet?.image,
  );

  const petBirthday = dashboardStatus?.birthday ?? pet?.birthday ?? null;
  const showBirthdayBanner =
    !loading && Boolean(pet?.name) && isBirthdayToday(petBirthday);
  const petCardLoading = loading && !pet;



  const userName = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  const [logFoodVisible, setLogFoodVisible] = useState(false);

  const [logWalkVisible, setLogWalkVisible] = useState(false);

  const [logMedicineVisible, setLogMedicineVisible] = useState(false);

  const [logGroomingVisible, setLogGroomingVisible] = useState(false);

  const [logVaccinationVisible, setLogVaccinationVisible] = useState(false);

  const [journalVisible, setJournalVisible] = useState(false);

  const [petSwitcherVisible, setPetSwitcherVisible] = useState(false);

  const [groomingManageVisible, setGroomingManageVisible] = useState(false);

  const [groomingManageRecord, setGroomingManageRecord] = useState<GroomingRecord | null>(null);

  const openGroomingManage = (recordId: string) => {

    const record = groomingRecords.find((item) => item._id === recordId) ?? null;

    setGroomingManageRecord(record);

    setGroomingManageVisible(true);

  };



  const handleSwitchPet = async (petId: string) => {
    if (!token) return;
    await switchPet(petId);
    if (user) {
      await activatePetSession({
        token,
        petId,
        user,
        setSession,
      });
    }
    await reloadPet();
    await reloadPets();
    setPetSwitcherVisible(false);
  };

  const isPremium = profileStats?.isPremium ?? user?.premiumStatus === 'premium';

  const handleAddPet = () => {
    if (!canAddAnotherPet(pets.length, isPremium)) {
      Alert.alert(
        'Premium required',
        'Free accounts include one pet. Upgrade to Premium to add more pets.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'View Premium', onPress: () => router.push('/profile/premium' as Href) },
        ],
      );
      return;
    }
    setPetSwitcherVisible(false);
    router.push({ pathname: '/pet/register', params: { mode: 'add' } });
  };



  if (petCardLoading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <SkeletonScreenLayout />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LoginHeaderDecor />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader
            userName={userName}
            dateLabel={formatDateLabel(new Date())}
            notificationCount={unreadCount}
            onJournalPress={canViewJournal ? () => setJournalVisible(true) : undefined}
            onNotificationsPress={() => router.push('/notifications' as Href)}
            showJournal={canViewJournal}
          />

          {!petCardLoading && accessBannerMessage ? <AuthInfoBanner message={accessBannerMessage} /> : null}

          {showBirthdayBanner ? (
            <PetBirthdayBanner petName={pet?.name ?? profile?.name ?? 'Your pet'} birthday={petBirthday} />
          ) : null}

          <PetProfileCard
            {...(profile ?? {})}
            imageUrl={petImageUrl}
            loading={petCardLoading}
            isBirthdayToday={showBirthdayBanner}
            isPremium={isPremium}
            onPress={pet ? () => setPetSwitcherVisible(true) : undefined}
          />

          {canView('grooming') ? (
          <GroomingAlertsRow
            token={token}
            petId={pet?._id}
            onAlertPress={
              canEdit('grooming')
                ? (record) => {
                    setGroomingManageRecord(record);
                    setGroomingManageVisible(true);
                  }
                : undefined
            }
          />
          ) : null}

          <QuickActionsSection
            onLogFoodPress={() => setLogFoodVisible(true)}
            onLogWalkPress={() => setLogWalkVisible(true)}
            onMedicinePress={() => setLogMedicineVisible(true)}
            onGroomingPress={() => setLogGroomingVisible(true)}
            onVaccinationPress={() => setLogVaccinationVisible(true)}
            groomingVisible={groomingVisible}
            canView={canView}
            canEdit={canEdit}
          />

          <UpNextSection
            loading={scheduleLoading}
            onLogFeeding={canEdit('feeding') ? completeFeeding : undefined}
            onLogWalk={canEdit('walks') ? completeWalk : undefined}
            onLogMedicine={canEdit('medicine') ? completeMedicine : undefined}
            onLogGrooming={canEdit('grooming') ? completeGrooming : undefined}
            onLogVaccination={canEdit('vaccination') ? completeVaccination : undefined}
            dashboardTasks={visibleDashboardTasks}
          />

          <TodaysScheduleSection
            feedingSchedules={visibleFeedingSchedules}
            walkSchedules={visibleWalkSchedules}
            medicineSchedules={visibleMedicineSchedules}
            groomingRecords={visibleGroomingRecords}
            vaccinationSchedules={visibleVaccinationSchedules}
            loading={scheduleLoading}
            feedingActionId={feedingActionId}
            walkActionId={walkActionId}
            medicineActionId={medicineActionId}
            groomingActionId={groomingActionId}
            vaccinationActionId={vaccinationActionId}
            onCompleteFeeding={canEdit('feeding') ? completeFeeding : undefined}
            onSkipFeeding={canEdit('feeding') ? skipFeeding : undefined}
            onCompleteWalk={canEdit('walks') ? completeWalk : undefined}
            onCompleteMedicine={canEdit('medicine') ? completeMedicine : undefined}
            onCompleteGrooming={canEdit('grooming') ? completeGrooming : undefined}
            onManageGrooming={canEdit('grooming') ? openGroomingManage : undefined}
            onCompleteVaccination={canEdit('vaccination') ? completeVaccination : undefined}
          />

          <RecentActivitySection />
        </ScrollView>

        <LogFoodSheet
          visible={logFoodVisible}
          onClose={() => setLogFoodVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => reloadFeeding(true)}
        />

        <LogWalkSheet
          visible={logWalkVisible}
          onClose={() => setLogWalkVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => reloadWalks(true)}
        />

        <LogMedicineSheet
          visible={logMedicineVisible}
          onClose={() => setLogMedicineVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => reloadMedicine(true)}
        />

        <LogGroomingSheet
          visible={logGroomingVisible}
          onClose={() => setLogGroomingVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => reloadGrooming(true)}
        />

        <LogVaccinationSheet
          visible={logVaccinationVisible}
          onClose={() => setLogVaccinationVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => reloadVaccination(true)}
        />

        <LogJournalSheet
          visible={journalVisible && canViewJournal}
          onClose={() => setJournalVisible(false)}
        />

        <GroomingManageSheet
          visible={groomingManageVisible}
          record={groomingManageRecord}
          token={token}
          onClose={() => {
            setGroomingManageVisible(false);
            setGroomingManageRecord(null);
          }}
          onUpdated={reloadGrooming}
        />

        <PetSwitcherSheet
          visible={petSwitcherVisible}
          pets={pets}
          activePetId={pet?._id}
          currentUserId={user?._id}
          switchingId={switchingId}
          onClose={() => setPetSwitcherVisible(false)}
          onSelectPet={handleSwitchPet}
          onAddPet={handleAddPet}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
});


