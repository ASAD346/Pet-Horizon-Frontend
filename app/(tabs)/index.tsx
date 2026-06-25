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
import { usePetPermissions } from '@/hooks/usePetPermissions';
import { usePets } from '@/hooks/usePets';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { PetSwitcherSheet } from '@/components/pet/PetSwitcherSheet';

import { resolveMediaUrl } from '@/lib/mediaUrl';

import { activatePetSession } from '@/lib/pet/activatePetSession';
import { isBirthdayToday } from '@/lib/pet/birthdayUtils';
import { dashboardTaskModule } from '@/lib/pet/petPermissionAccess';

import { petToProfileProps, formatPetAge } from '@/services/pets/petDisplay';

import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';

import { LogFoodSheet } from '@/components/log-food';

import { LogGroomingSheet } from '@/components/log-grooming';

import { GroomingManageSheet } from '@/components/log-grooming/GroomingManageSheet';

import { LogJournalSheet } from '@/components/journal';

import { LogMedicineSheet } from '@/components/log-medicine';

import { LogWalkSheet } from '@/components/log-walk';

import { LogVaccinationSheet } from '@/components/log-vaccination';

import {
  mapActivityTypeToCategory,
  formatEntryTitle,
  categoryToMaterialIcon,
} from '@/lib/journal/journalMappers';

import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { canAddAnotherPet } from '@/lib/premium/canAddPet';
import { HomeTheme, Spacing } from '@/constants/theme';
import { SkeletonScreenLayout } from '@/components/ui/skeletons';
import type { GroomingRecord } from '@/types/grooming';



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

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
    refetch: refetchDashboard,
    completeFeeding,
    skipFeeding,
    completeWalk,
    completeMedicine,
    completeGrooming,
    completeVaccination,
  } = useDashboardQuery(token, pet?._id);

  const { pets, switchingId, switchPet, reload: reloadPets } = usePets(
    token,
    pet?._id ?? user?.activePetId,
    user?._id,
  );

  useFocusEffect(
    useCallback(() => {
      void refetchDashboard();
    }, [refetchDashboard])
  );

  const feedingSchedules = dashboardData?.todaySchedules?.feeding ?? [];
  const walkSchedules = dashboardData?.todaySchedules?.walk ?? [];
  const medicineSchedules = dashboardData?.todaySchedules?.medicine ?? [];
  const groomingRecords = dashboardData?.todaySchedules?.grooming ?? [];
  const vaccinationSchedules = dashboardData?.todaySchedules?.vaccination ?? [];
  const dashboardTasks = dashboardData?.upcomingTasks ?? [];
  const unreadCount = dashboardData?.notifications?.unreadCount ?? 0;
  
  const scheduleLoading = dashboardLoading;

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

  const profileStats = dashboardData?.activePet;
  const isPremium = profileStats?.isPremium ?? user?.premiumStatus === 'premium';

  const profile = useMemo(() => {
    let baseProfile: any = null;
    if (profileStats && profileStats.petId === pet?._id) {
      baseProfile = {
        ...profileStats,
        species: profileStats.species || pet?.species || '—',
        activity: profileStats.plan ? String(profileStats.plan).toUpperCase() : 'FREE',
        health: profileStats.weight != null ? `${profileStats.weight} ${String(profileStats.weightUnit || 'kg').toUpperCase()}` : '—',
        mood: profileStats.isPremium ? 'Premium' : 'Free',
      };
    } else if (pet) {
      const mapped = petToProfileProps(pet);
      baseProfile = {
        ...mapped,
        species: pet.species || '—',
        activity: isPremium ? 'PREMIUM' : 'FREE',
        health: mapped.weight,
        mood: isPremium ? 'Premium' : 'Free',
      };
    } else if (profileStats) {
      baseProfile = {
        ...profileStats,
        species: profileStats.species || '—',
        activity: profileStats.plan ? String(profileStats.plan).toUpperCase() : 'FREE',
        health: profileStats.weight != null ? `${profileStats.weight} ${String(profileStats.weightUnit || 'kg').toUpperCase()}` : '—',
        mood: profileStats.isPremium ? 'Premium' : 'Free',
      };
    }

    if (baseProfile) {
      let ageStr = baseProfile.birthday ? formatPetAge(baseProfile.birthday) : '—';
      if (ageStr === '—') {
        if (baseProfile.age != null) {
          const ageVal = String(baseProfile.age);
          ageStr = /^\d+$/.test(ageVal) ? `${ageVal} years` : ageVal;
        } else {
          ageStr = '—';
        }
      }
      return {
        ...baseProfile,
        age: ageStr,
      };
    }
    return null;
  }, [pet, profileStats, isPremium]);

  const petImageUrl = resolveMediaUrl(
    profileStats?.petId === pet?._id ? profileStats?.photoUrl ?? pet?.image : pet?.image,
  );

  const petBirthday = profileStats?.birthday ?? pet?.birthday ?? null;
  const showBirthdayBanner =
    !loading && Boolean(pet?.name) && isBirthdayToday(petBirthday);
  const petCardLoading = loading && !pet;

  const recentActivities = useMemo(() => {
    const list = dashboardData?.recentActivities ?? [];
    return list.slice(0, 5).map((entry) => {
      const category = mapActivityTypeToCategory(entry.activityType);
      const colors = ACTIVITY_COLORS[category] || ACTIVITY_COLORS.general;
      
      const date = new Date(entry.createdAt);
      const isToday = new Date().toDateString() === date.toDateString();
      const timeLabel = isToday
        ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const actorName = entry.userId?._id === user?._id || entry.userId === user?._id 
        ? 'You' 
        : (entry.userId?.fullName ? entry.userId.fullName : 'A family member');
      
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
  }, [dashboardData?.recentActivities, user]);



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

  const openGroomingManage = useCallback((recordId: string) => {
    const record = groomingRecords.find((item) => item._id === recordId) ?? null;
    setGroomingManageRecord(record);
    setGroomingManageVisible(true);
  }, [groomingRecords]);

  const handleSwitchPet = useCallback(async (petId: string) => {
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
  }, [token, switchPet, user, setSession, reloadPet, reloadPets]);

  const handleAddPet = useCallback(() => {
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
  }, [pets.length, isPremium, router]);



  const handleCompleteFeeding = useCallback(async (scheduleId: string) => {
    await completeFeeding(scheduleId);
  }, [completeFeeding]);

  const handleSkipFeeding = useCallback(async (scheduleId: string) => {
    await skipFeeding(scheduleId);
  }, [skipFeeding]);

  const handleCompleteWalk = useCallback(async (scheduleId: string) => {
    await completeWalk(scheduleId);
  }, [completeWalk]);

  const handleCompleteMedicine = useCallback(async (scheduleId: string) => {
    await completeMedicine(scheduleId);
  }, [completeMedicine]);

  const handleCompleteGrooming = useCallback(async (recordId: string) => {
    await completeGrooming(recordId);
  }, [completeGrooming]);

  const handleCompleteVaccination = useCallback(async (scheduleId: string) => {
    await completeVaccination(scheduleId);
  }, [completeVaccination]);

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

        <PetProfileCard
          {...(profile ?? {})}
          imageUrl={petImageUrl}
          loading={petCardLoading}
          isBirthdayToday={showBirthdayBanner}
          isPremium={isPremium}
          onPress={pet ? () => setPetSwitcherVisible(true) : undefined}
          onEditPress={pet ? () => router.push({ pathname: '/pet/register', params: { mode: 'edit', petId: pet._id } }) : undefined}
        />

        {showBirthdayBanner ? (
          <PetBirthdayBanner petName={pet?.name ?? profile?.name ?? 'Your pet'} birthday={petBirthday} />
        ) : null}

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
          groomingVisible={canView('grooming')}
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
          feedingActionId={undefined}
          walkActionId={undefined}
          medicineActionId={undefined}
          groomingActionId={undefined}
          vaccinationActionId={undefined}
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
            void refetchDashboard();
          }}
        />

        <LogWalkSheet
          visible={logWalkVisible}
          onClose={() => setLogWalkVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            void refetchDashboard();
          }}
        />

        <LogMedicineSheet
          visible={logMedicineVisible}
          onClose={() => setLogMedicineVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            void refetchDashboard();
          }}
        />

        <LogGroomingSheet
          visible={logGroomingVisible}
          onClose={() => setLogGroomingVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            void refetchDashboard();
          }}
        />

        <LogVaccinationSheet
          visible={logVaccinationVisible}
          onClose={() => setLogVaccinationVisible(false)}
          petId={pet?._id ?? null}
          token={token}
          onSaved={() => {
            void refetchDashboard();
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
          onUpdated={() => void refetchDashboard()}
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


