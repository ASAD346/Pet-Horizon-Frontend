import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityTimelineSection } from './ActivityTimelineSection';
import { JournalCategoryChips } from './JournalCategoryChips';
import { JournalDateStrip } from './JournalDateStrip';
import { JournalMonthHeader } from './JournalMonthHeader';
import {
  JOURNAL_CATEGORY_CHIPS,
  JOURNAL_DATES,
  JOURNAL_MONTH_LABEL,
  JOURNAL_TIMELINE_EVENTS,
} from './journalData';
import type { JournalCategory } from './journalData';
import { TodaysPhotosSection } from './TodaysPhotosSection';
import { Spacing } from '../../constants/theme';

export function JournalContent() {
  const [selectedDateId, setSelectedDateId] = useState<string>(JOURNAL_DATES[0].id);
  const [category, setCategory] = useState<JournalCategory>('all');

  return (
    <View style={styles.content}>
      <JournalMonthHeader monthLabel={JOURNAL_MONTH_LABEL} />
      <JournalDateStrip
        dates={JOURNAL_DATES}
        selectedId={selectedDateId}
        onSelect={setSelectedDateId}
      />
      <JournalCategoryChips
        chips={JOURNAL_CATEGORY_CHIPS}
        selected={category}
        onSelect={setCategory}
      />
      <ActivityTimelineSection events={JOURNAL_TIMELINE_EVENTS} categoryFilter={category} />
      <TodaysPhotosSection />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.md,
  },
});
