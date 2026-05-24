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
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { petToProfileProps } from '@/services/pets/petDisplay';
import { LogFoodSheet } from '@/components/log-food';
import { LogGroomingSheet } from '@/components/log-grooming';
import { LogMedicineSheet } from '@/components/log-medicine';
import { LogWalkSheet } from '@/components/log-walk';
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

  const profile = useMemo(() => (pet ? petToProfileProps(pet) : null), [pet]);

  const userName = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';
  const [logFoodVisible, setLogFoodVisible] = useState(false);
  const [logWalkVisible, setLogWalkVisible] = useState(false);
  const [logMedicineVisible, setLogMedicineVisible] = useState(false);
  const [logGroomingVisible, setLogGroomingVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader userName={userName} dateLabel={formatDateLabel(new Date())} />
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
        />
        <UpNextSection />
        <TodaysScheduleSection />
        <RecentActivitySection />
        <View style={styles.tabSpacer} />
      </ScrollView>

      <LogFoodSheet visible={logFoodVisible} onClose={() => setLogFoodVisible(false)} />
      <LogWalkSheet visible={logWalkVisible} onClose={() => setLogWalkVisible(false)} />
      <LogMedicineSheet visible={logMedicineVisible} onClose={() => setLogMedicineVisible(false)} />
      <LogGroomingSheet visible={logGroomingVisible} onClose={() => setLogGroomingVisible(false)} />
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
