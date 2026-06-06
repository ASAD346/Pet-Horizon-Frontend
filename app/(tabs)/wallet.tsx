import React, { useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { ExpenseTrackerView } from '@/components/expense';
import { LogJournalSheet } from '@/components/journal';

export default function ExpenseTrackerScreen() {
  const router = useRouter();
  const [journalVisible, setJournalVisible] = useState(false);

  return (
    <>
      <ExpenseTrackerView
        onJournalPress={() => setJournalVisible(true)}
        onNotificationsPress={() => router.push('/notifications' as Href)}
      />
      <LogJournalSheet visible={journalVisible} onClose={() => setJournalVisible(false)} />
    </>
  );
}
