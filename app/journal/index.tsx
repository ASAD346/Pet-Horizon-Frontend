import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { JournalContent } from '@/components/journal';
import { JournalTheme, Spacing } from '@/constants/theme';

/** Standalone route fallback — prefer LogJournalSheet overlay from Home / Expense tab. */
export default function PetJournalScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <JournalContent active />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: JournalTheme.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
