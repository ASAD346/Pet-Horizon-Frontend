import React, { useState } from 'react';
import { ExpenseTrackerView } from '@/components/expense';
import { LogJournalSheet } from '@/components/journal';

export default function ExpenseTrackerScreen() {
  const [journalVisible, setJournalVisible] = useState(false);

  return (
    <>
      <ExpenseTrackerView onJournalPress={() => setJournalVisible(true)} />
      <LogJournalSheet visible={journalVisible} onClose={() => setJournalVisible(false)} />
    </>
  );
}
