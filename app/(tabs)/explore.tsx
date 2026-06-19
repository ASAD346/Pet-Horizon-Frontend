import React, { useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { ScheduleSetupView } from '@/components/schedule';
import { LogJournalSheet } from '@/components/journal';

export default function ScheduleScreen() {
  const router = useRouter();
  const [journalVisible, setJournalVisible] = useState(false);

  return (
    <>
      <ScheduleSetupView
        onJournalPress={() => setJournalVisible(true)}
        onNotificationsPress={() => router.push('/notifications' as Href)}
      />
      <LogJournalSheet visible={journalVisible} onClose={() => setJournalVisible(false)} />
    </>
  );
}
