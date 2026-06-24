import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, type Href, useFocusEffect } from 'expo-router';

import { StatusBar } from 'expo-status-bar';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

import { useJournalEntries } from '@/hooks/useJournalEntries';
import {
  mapActivityTypeToCategory,
  formatEntryTitle,
  categoryToMaterialIcon,
} from '@/lib/journal/journalMappers';

import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { canAddAnotherPet } from '@/lib/premium/canAddPet';
import { HomeTheme, Spacing } from '@/constants/theme';
import { SkeletonScreenLayout } from '@/components/ui/skeletons';
import { clearCachedSchedules, getCacheVersion } from '@/lib/schedule/scheduleCache';
import type { GroomingRecord } from '@/types/grooming';
import { fetchPetMembers } from '@/services/family/familyApi';
import type { PetMemberRow } from '@/types/family';



function formatDateLabel(date: Date): string {

  return date.toLocaleDateString('en-US', {

    weekday: 'long',

    month: 'long',

    day: 'numeric',

  });

}



const ACTIVITY_COLORS: Record<string, { color: string; bg: string }> = {
  food: { color: '#D97706', bg: '#FEF3C7' },
  walk: { color: '#2563EB', bg: '#DBEAFE' },
  medicine: { color: '#9333EA', bg: '#F3E8FF' },
  grooming: { color: '#0D9488', bg: '#CCFBF1' },
  vaccination: { color: '#DB2777', bg: '#FCE7F3' },
  general: { color: '#4B5563', bg: '#F3F4F6' },
};

export default function HomeScreen() {
  const { clearance: tabBarClearance } = useTabBarLayout();
  const insets = useSafeAreaInsets();

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

  const { tasks: dashboardTasks, loading: tasksLoading, reload: reloadTasks } = useUpcomingTasks(token);

  const { unreadCount } = useNotifications(token);

  const { entries: journalEntries, reload: reloadJournal } = useJournalEntries(
    token,
    pet?._id ?? null,
    Boolean(token && pet?._id),
  );

  const [familyMembers, setFamilyMembers] = useState<PetMemberRow[]>([]);

  useEffect(() => {
    if (token && pet?._id) {
      fetchPetMembers(token, pet._id)
        .then(setFamilyMembers)
        .catch(() => setFamilyMembers([]));
    } else {
      setFamilyMembers([]);
    }
  }, [token, pet?._id]);

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



  const lastCacheVersionRef = useRef(getCacheVersion());

  useFocusEffect(
    useCallback(() => {
      const currentVersion = getCacheVersion();
      if (currentVersion !== lastCacheVersionRef.current) {
        lastCacheVersionRef.current = currentVersion;
        // Forced reload of all schedule hooks to show skeletons and sync them
        void reloadFeeding(true);
        void reloadWalks(true);
        void reloadMedicine(true);
        void reloadGrooming(true);
        void reloadVaccination(true);
        void reloadTasks(true);
      }
    }, [reloadFeeding, reloadWalks, reloadMedicine, reloadGrooming, reloadVaccination, reloadTasks])
  );

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

  const recentActivities = useMemo(() => {
    return journalEntries.slice(0, 5).map((entry) => {
      const category = mapActivityTypeToCategory(entry.activityType);
      const colors = ACTIVITY_COLORS[category] || ACTIVITY_COLORS.general;
      
      const date = new Date(entry.createdAt);
      const isToday = new Date().toDateString() === date.toDateString();
      const timeLabel = isToday
        ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const member = familyMembers.find((m) => m.userId?._id === entry.userId);
      const actorName = entry.userId === user?._id 
        ? 'You' 
        : (member?.userId?.fullName ? member.userId.fullName : 'A family member');
      
      let actionText = entry.note ? entry.note.trim() : `logged ${category}`;
      if (actionText.toLowerCase().startsWith('completed')) {
        actionText = actionText.replace(/^[Cc]ompleted\s*/, 'completed ');
      } else if (actionText.toLowerCase().startsWith('skipped')) {
        actionText = actionText.replace(/^[Ss]kipped\s*/, 'skipped ');
      } else if (actionText.toLowerCase().startsWith('logged')) {
        actionText = actionText.replace(/^[Ll]ogged\s*/, 'logged ');
      } else {
        actionText = `logged ${category}: ${actionText}`;
      }

      return {
        id: entry._id,
        actorName,
        actionText,
        time: timeLabel,
        icon: categoryToMaterialIcon(category) as any,
        color: colors.color,
        bg: colors.bg,
      };
    });
  }, [journalEntries, user, familyMembers]);



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



  const handleCompleteFeeding = async (scheduleId: string) => {
    if (completeFeeding) {
      await completeFeeding(scheduleId);
      if (pet?._id) clearCachedSchedules(pet._id);
      void reloadJournal();
    }
  };

  const handleSkipFeeding = async (scheduleId: string) => {
    if (skipFeeding) {
      await skipFeeding(scheduleId);
      if (pet?._id) clearCachedSchedules(pet._id);
      void reloadJournal();
    }
  };

  const handleCompleteWalk = async (scheduleId: string) => {
    if (completeWalk) {
      await completeWalk(scheduleId);
      if (pet?._id) clearCachedSchedules(pet._id);
      void reloadJournal();
    }
  };

  const handleCompleteMedicine = async (scheduleId: string) => {
    if (completeMedicine) {
      await completeMedicine(scheduleId);
      if (pet?._id) clearCachedSchedules(pet._id);
      void reloadJournal();
    }
  };

  const handleCompleteGrooming = async (recordId: string) => {
    if (completeGrooming) {
      await completeGrooming(recordId);
      if (pet?._id) clearCachedSchedules(pet._id);
      void reloadJournal();
    }
  };

  const handleCompleteVaccination = async (scheduleId: string) => {
    if (completeVaccination) {
      await completeVaccination(scheduleId);
      if (pet?._id) clearCachedSchedules(pet._id);
      void reloadJournal();
    }
  };

  if (petCardLoading) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <HomeHeader
          userName={userName}
          dateLabel={formatDateLabel(new Date())}
          notificationCount={unreadCount}
          onJournalPress={canViewJournal ? () => setJournalVisible(true) : undefined}
          onNotificationsPress={() => router.push('/notifications' as Href)}
          showJournal={canViewJournal}
          topInset={insets.top}
          isPremium={isPremium}
        />
        <View style={styles.skeletonArea}>
          <SkeletonScreenLayout />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Sticky header — lives outside ScrollView, extends behind status bar */}
      <HomeHeader
        userName={userName}
        dateLabel={formatDateLabel(new Date())}
        notificationCount={unreadCount}
        onJournalPress={canViewJournal ? () => setJournalVisible(true) : undefined}
        onNotificationsPress={() => router.push('/notifications' as Href)}
        showJournal={canViewJournal}
        topInset={insets.top}
        isPremium={isPremium}
      />

      {/* Scrollable content area below the sticky header */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
      >
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
          isPremium={isPremium}
        />

        <UpNextSection
          loading={scheduleLoading}
          onLogFeeding={canEdit('feeding') ? handleCompleteFeeding : undefined}
          onLogWalk={canEdit('walks') ? handleCompleteWalk : undefined}
          onLogMedicine={canEdit('medicine') ? handleCompleteMedicine : undefined}
          onLogGrooming={canEdit('grooming') ? handleCompleteGrooming : undefined}
          onLogVaccination={canEdit('vaccination') ? handleCompleteVaccination : undefined}
          dashboardTasks={visibleDashboardTasks}
          isPremium={isPremium}
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
          onCompleteFeeding={canEdit('feeding') ? handleCompleteFeeding : undefined}
          onSkipFeeding={canEdit('feeding') ? handleSkipFeeding : undefined}
          onCompleteWalk={canEdit('walks') ? handleCompleteWalk : undefined}
          onCompleteMedicine={canEdit('medicine') ? handleCompleteMedicine : undefined}
          onCompleteGrooming={canEdit('grooming') ? handleCompleteGrooming : undefined}
          onManageGrooming={canEdit('grooming') ? openGroomingManage : undefined}
          onCompleteVaccination={canEdit('vaccination') ? handleCompleteVaccination : undefined}
          isPremium={isPremium}
        />

        <RecentActivitySection activities={recentActivities} isPremium={isPremium} />
      </ScrollView>

        <LogFoodSheet
          visible={logFoodVisible}
          onClose={() => setLogFoodVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            reloadFeeding(true);
            void reloadJournal();
          }}
        />

        <LogWalkSheet
          visible={logWalkVisible}
          onClose={() => setLogWalkVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            reloadWalks(true);
            void reloadJournal();
          }}
        />

        <LogMedicineSheet
          visible={logMedicineVisible}
          onClose={() => setLogMedicineVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            reloadMedicine(true);
            void reloadJournal();
          }}
        />

        <LogGroomingSheet
          visible={logGroomingVisible}
          onClose={() => setLogGroomingVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            reloadGrooming(true);
            void reloadJournal();
          }}
        />

        <LogVaccinationSheet
          visible={logVaccinationVisible}
          onClose={() => setLogVaccinationVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            reloadVaccination(true);
            void reloadJournal();
          }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F7F1',   // Matches the ScrollView soft green background so curved header corners are visible
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F1F7F1',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  skeletonArea: {
    flex: 1,
    backgroundColor: '#F1F7F1',
  },
});


