import React, { useState } from 'react';
import { type Href } from 'expo-router';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import { StatusBar } from 'expo-status-bar';
import { ScheduleSetupView } from '@/components/schedule';
import { LogJournalSheet } from '@/components/journal';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';

export default function ScheduleScreen() {
  const router = useDebouncedRouter();
  const [journalVisible, setJournalVisible] = useState(false);
  const { token } = useAuth();
  const { reload: reloadPet } = useActivePet(token);

  return (
    <>
      <StatusBar style="dark" />
      <ScheduleSetupView
        onJournalPress={() => setJournalVisible(true)}
        onNotificationsPress={() => router.navigate('/notifications' as Href)}
        onPetReload={() => void reloadPet(true)}
      />
      <LogJournalSheet visible={journalVisible} onClose={() => setJournalVisible(false)} />
    </>
  );
}
