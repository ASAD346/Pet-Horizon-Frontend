import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
import { HomeTheme, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <PetProfileCard />
        <ReminderCardsRow />
        <QuickActionsSection />
        <UpNextSection />
        <TodaysScheduleSection />
        <RecentActivitySection />
        <View style={styles.tabSpacer} />
      </ScrollView>
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
