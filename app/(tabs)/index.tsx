import React, { useMemo, useState } from 'react';

import { ScrollView, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import {

  HomeHeader,

  PetProfileCard,

  QuickActionsSection,

  RecentActivitySection,

  ReminderCardsRow,

  TodaysScheduleSection,

  UpNextSection,

} from '@/components/home';

import { useAuth } from '@/contexts/AuthContext';

import { useActivePet } from '@/hooks/useActivePet';

import { useFeedingSchedules } from '@/hooks/useFeedingSchedules';

import { useWalkSchedules } from '@/hooks/useWalkSchedules';

import { useMedicineSchedules } from '@/hooks/useMedicineSchedules';

import { useGroomingRecords } from '@/hooks/useGroomingRecords';

import { useVaccinationSchedules } from '@/hooks/useVaccinationSchedules';

import { resolveMediaUrl } from '@/lib/mediaUrl';

import { petToProfileProps } from '@/services/pets/petDisplay';

import { LogFoodSheet } from '@/components/log-food';

import { LogGroomingSheet } from '@/components/log-grooming';

import { LogJournalSheet } from '@/components/journal';

import { LogMedicineSheet } from '@/components/log-medicine';

import { LogWalkSheet } from '@/components/log-walk';

import { LogVaccinationSheet } from '@/components/log-vaccination';

import { HomeTheme, Spacing } from '@/constants/theme';



function formatDateLabel(date: Date): string {

  return date.toLocaleDateString('en-US', {

    weekday: 'long',

    month: 'long',

    day: 'numeric',

  });

}



export default function HomeScreen() {

  const router = useRouter();

  const { token, user } = useAuth();

  const { pet, loading } = useActivePet(token);



  const {

    schedules: feedingSchedules,

    loading: feedingLoading,

    actionId: feedingActionId,

    reload: reloadFeeding,

    completeFeeding,

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



  const scheduleLoading = feedingLoading || walkLoading || medicineLoading || groomingLoading || vaccinationLoading;



  const profile = useMemo(() => (pet ? petToProfileProps(pet) : null), [pet]);



  const userName = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  const [logFoodVisible, setLogFoodVisible] = useState(false);

  const [logWalkVisible, setLogWalkVisible] = useState(false);

  const [logMedicineVisible, setLogMedicineVisible] = useState(false);

  const [logGroomingVisible, setLogGroomingVisible] = useState(false);

  const [logVaccinationVisible, setLogVaccinationVisible] = useState(false);

  const [journalVisible, setJournalVisible] = useState(false);



  return (

    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <ScrollView

        style={styles.scroll}

        contentContainerStyle={styles.content}

        showsVerticalScrollIndicator={false}

      >

        <HomeHeader

          userName={userName}

          dateLabel={formatDateLabel(new Date())}

          onJournalPress={() => setJournalVisible(true)}

        />

        <PetProfileCard

          {...(profile ?? {})}

          imageUrl={resolveMediaUrl(pet?.image)}

          loading={loading}

          onAddPet={() => router.push({ pathname: '/pet/register', params: { mode: 'add' } })}

        />

        <ReminderCardsRow />

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

          onCompleteWalk={completeWalk}

          onCompleteMedicine={completeMedicine}

          onCompleteGrooming={completeGrooming}

          onCompleteVaccination={completeVaccination}

        />

        <RecentActivitySection />

        <View style={styles.tabSpacer} />

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

    paddingBottom: Spacing.md,

  },

  tabSpacer: {

    height: 88,

  },

});


