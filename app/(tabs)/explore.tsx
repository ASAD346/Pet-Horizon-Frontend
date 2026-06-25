import React, { useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { ScheduleSetupView } from '@/components/schedule';
import { LogJournalSheet } from '@/components/journal';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';

export default function ScheduleScreen() {
  const router = useRouter();
  const [journalVisible, setJournalVisible] = useState(false);
  const { token } = useAuth();
  const { reload: reloadPet } = useActivePet(token);

  return (
    <>
      <ScheduleSetupView
        onJournalPress={() => setJournalVisible(true)}
        onNotificationsPress={() => router.push('/notifications' as Href)}
        onPetReload={() => void reloadPet(true)}
      />
      <LogJournalSheet visible={journalVisible} onClose={() => setJournalVisible(false)} />
    </>
  );
}
