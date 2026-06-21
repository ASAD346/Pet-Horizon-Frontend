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

import { usePets } from '@/hooks/usePets';

import { useUpcomingTasks } from '@/hooks/useUpcomingTasks';

import { PetSwitcherSheet } from '@/components/pet/PetSwitcherSheet';

import { useFeedingSchedules } from '@/hooks/useFeedingSchedules';

import { useWalkSchedules } from '@/hooks/useWalkSchedules';

import { useMedicineSchedules } from '@/hooks/useMedicineSchedules';

import { useGroomingRecords } from '@/hooks/useGroomingRecords';

import { useVaccinationSchedules } from '@/hooks/useVaccinationSchedules';

import { resolveMediaUrl } from '@/lib/mediaUrl';

import { isBirthdayToday } from '@/lib/pet/birthdayUtils';

import { petToProfileProps } from '@/services/pets/petDisplay';

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

  const { profileStats, status: dashboardStatus } = useDashboardStatus(token);

  const { tasks: dashboardTasks, loading: tasksLoading } = useUpcomingTasks(token);

  const { unreadCount } = useNotifications(token);

  const { pets, switchingId, switchPet, reload: reloadPets } = usePets(token, pet?._id ?? user?.activePetId);



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



  const profile = useMemo(() => {
    if (profileStats) return profileStats;
    if (pet) return petToProfileProps(pet);
    return null;
  }, [pet, profileStats]);

  const petImageUrl = resolveMediaUrl(profileStats?.photoUrl ?? pet?.image);

  const petBirthday = dashboardStatus?.birthday ?? pet?.birthday ?? null;
  const showBirthdayBanner = !loading && Boolean(pet?.name) && isBirthdayToday(petBirthday);



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
      await setSession({ token, user: { ...user, activePetId: petId } });
    }
    await reloadPet();
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



  return (

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

          onJournalPress={() => setJournalVisible(true)}

          onNotificationsPress={() => router.push('/notifications' as Href)}

        />

        {showBirthdayBanner ? (
          <PetBirthdayBanner petName={pet?.name ?? profile?.name ?? 'Your pet'} birthday={petBirthday} />
        ) : null}

        <PetProfileCard

          {...(profile ?? {})}

          imageUrl={petImageUrl}

          loading={loading}

          isBirthdayToday={showBirthdayBanner}

          onPress={pet ? () => setPetSwitcherVisible(true) : undefined}

        />

        <GroomingAlertsRow

          token={token}

          petId={pet?._id}

          onAlertPress={(record) => {

            setGroomingManageRecord(record);

            setGroomingManageVisible(true);

          }}

        />

        <QuickActionsSection

          onLogFoodPress={() => setLogFoodVisible(true)}

          onLogWalkPress={() => setLogWalkVisible(true)}

          onMedicinePress={() => setLogMedicineVisible(true)}

          onGroomingPress={() => setLogGroomingVisible(true)}

          onVaccinationPress={() => setLogVaccinationVisible(true)}

          groomingVisible={groomingVisible}

        />

        <UpNextSection

          feedingSchedules={feedingSchedules}

          walkSchedules={walkSchedules}

          medicineSchedules={medicineSchedules}

          groomingRecords={groomingRecords}

          vaccinationSchedules={vaccinationSchedules}

          loading={scheduleLoading}

          feedingActionId={feedingActionId}

          walkActionId={walkActionId}

          medicineActionId={medicineActionId}

          groomingActionId={groomingActionId}

          vaccinationActionId={vaccinationActionId}

          onLogFeeding={completeFeeding}

          onLogWalk={completeWalk}

          onLogMedicine={completeMedicine}

          onLogGrooming={completeGrooming}

          onLogVaccination={completeVaccination}

          dashboardTasks={dashboardTasks}

        />

        <TodaysScheduleSection

          feedingSchedules={feedingSchedules}

          walkSchedules={walkSchedules}

          medicineSchedules={medicineSchedules}

          groomingRecords={groomingRecords}

          vaccinationSchedules={vaccinationSchedules}

          loading={scheduleLoading}

          feedingActionId={feedingActionId}

          walkActionId={walkActionId}

          medicineActionId={medicineActionId}

          groomingActionId={groomingActionId}

          vaccinationActionId={vaccinationActionId}

          onCompleteFeeding={completeFeeding}

          onSkipFeeding={skipFeeding}

          onCompleteWalk={completeWalk}

          onCompleteMedicine={completeMedicine}

          onCompleteGrooming={completeGrooming}

          onManageGrooming={openGroomingManage}

          onCompleteVaccination={completeVaccination}

        />

        <RecentActivitySection />

      </ScrollView>



      <LogFoodSheet

        visible={logFoodVisible}

        onClose={() => setLogFoodVisible(false)}

        petId={pet?._id ?? null}

        token={token}

        onSaved={reloadFeeding}

      />

      <LogWalkSheet

        visible={logWalkVisible}

        onClose={() => setLogWalkVisible(false)}

        petId={pet?._id ?? null}

        token={token}

        onSaved={reloadWalks}

      />

      <LogMedicineSheet

        visible={logMedicineVisible}

        onClose={() => setLogMedicineVisible(false)}

        petId={pet?._id ?? null}

        token={token}

        onSaved={reloadMedicine}

      />

      <LogGroomingSheet

        visible={logGroomingVisible}

        onClose={() => setLogGroomingVisible(false)}

        petId={pet?._id ?? null}

        token={token}

        onSaved={reloadGrooming}

      />

      <LogVaccinationSheet

        visible={logVaccinationVisible}

        onClose={() => setLogVaccinationVisible(false)}

        petId={pet?._id ?? null}

        token={token}

        onSaved={reloadVaccination}

      />

      <LogJournalSheet visible={journalVisible} onClose={() => setJournalVisible(false)} />

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

        switchingId={switchingId}

        onClose={() => setPetSwitcherVisible(false)}

        onSelectPet={handleSwitchPet}

        onAddPet={handleAddPet}

      />

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safeArea: {

    flex: 1,

    backgroundColor: HomeTheme.background,

  },

  scroll: {

    flex: 1,

  },

  content: {

    paddingHorizontal: Spacing.lg,

    paddingTop: Spacing.sm,

  },

});


