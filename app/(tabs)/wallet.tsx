import React, { useState } from 'react';
import { type Href } from 'expo-router';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import { StatusBar } from 'expo-status-bar';
import { ExpenseTrackerView } from '@/components/expense';
import { LogJournalSheet } from '@/components/journal';

export default function ExpenseTrackerScreen() {
  const router = useDebouncedRouter();
  const [journalVisible, setJournalVisible] = useState(false);

  return (
    <>
      <StatusBar style="dark" />
      <ExpenseTrackerView
        onJournalPress={() => setJournalVisible(true)}
        onNotificationsPress={() => router.navigate('/notifications' as Href)}
      />
      <LogJournalSheet visible={journalVisible} onClose={() => setJournalVisible(false)} />
    </>
  );
}
