import React, { useEffect, useState } from 'react';
import type { GroomingTypeOption } from '@/types/grooming';
import type {
  FeedingEntryState,
  GroomingEntryState,
  MedicineEntryState,
  VaccinationEntryState,
  WalkEntryState,
} from '@/lib/schedule/types';
import { FormSheetShell } from '@/components/sheets';
import { type ScheduleSectionTheme } from './scheduleTheme';
import { FeedingEntryCard } from './entries/FeedingEntryCard';
import { WalkEntryCard } from './entries/WalkEntryCard';
import { MedicineEntryCard } from './entries/MedicineEntryCard';
import { VaccinationEntryCard } from './entries/VaccinationEntryCard';
import { GroomingEntryCard } from './entries/GroomingEntryCard';
import { useAuth } from '@/hooks/useAuth';

type EditorEntry =
  | FeedingEntryState
  | WalkEntryState
  | MedicineEntryState
  | VaccinationEntryState
  | GroomingEntryState;

const SECTION_SUBTITLES: Record<ScheduleSectionTheme['key'], string | undefined> = {
  feeding: undefined,
  walk: undefined,
  medicine: undefined,
  vaccination: undefined,
  grooming: undefined,
};

export interface ScheduleEntryEditorSheetProps {
  visible: boolean;
  mode: 'add' | 'edit';
  section: ScheduleSectionTheme;
  entry: EditorEntry | null;
  mealTypeOptions: { value: string; label: string }[];
  unitOptions: { value: string; label: string }[];
  groomingTypeOptions: GroomingTypeOption[];
  saving?: boolean;
  error?: string | null;
  onChange: (entry: EditorEntry) => void;
  onSave: () => void;
  onClose: () => void;
}

export function ScheduleEntryEditorSheet({
  visible,
  mode,
  section,
  entry,
  mealTypeOptions,
  unitOptions,
  groomingTypeOptions,
  saving,
  error,
  onChange,
  onSave,
  onClose,
}: ScheduleEntryEditorSheetProps) {
  const [draft, setDraft] = useState<EditorEntry | null>(entry);
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';

  // Cohesive brand colors
  const brandColor = isPremium ? '#184F2E' : '#3A8F3B';
  const brandBg = isPremium ? '#E8F5E9' : '#EEF8EE';

  useEffect(() => {
    if (visible) setDraft(entry);
  }, [visible, entry]);

  const handleChange = (next: EditorEntry) => {
    setDraft(next);
    onChange(next);
  };

  const title = mode === 'add' ? section.addLabel : `Edit ${section.title}`;

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={SECTION_SUBTITLES[section.key]}
      icon={section.icon}
      accentColor={brandColor}
      accentBg={brandBg}
      saveLabel={mode === 'add' ? 'Add Schedule' : 'Save Changes'}
      onSave={onSave}
      saving={saving}
      saveDisabled={!draft}
      error={error}
      compact
    >
      {draft && section.key === 'feeding' ? (
        <FeedingEntryCard
          entry={draft as FeedingEntryState}
          index={0}
          accentColor={brandColor}
          accentBg={brandBg}
          mealTypeOptions={mealTypeOptions}
          unitOptions={unitOptions}
          canRemove={false}
          embeddedInSheet
          onChange={(next) => handleChange(next)}
          onRemove={() => {}}
        />
      ) : null}

      {draft && section.key === 'walk' ? (
        <WalkEntryCard
          entry={draft as WalkEntryState}
          index={0}
          accentColor={brandColor}
          accentBg={brandBg}
          canRemove={false}
          embeddedInSheet
          onChange={(next) => handleChange(next)}
          onRemove={() => {}}
        />
      ) : null}

      {draft && section.key === 'medicine' ? (
        <MedicineEntryCard
          entry={draft as MedicineEntryState}
          index={0}
          accentColor={brandColor}
          accentBg={brandBg}
          canRemove={false}
          embeddedInSheet
          onChange={(next) => handleChange(next)}
          onRemove={() => {}}
        />
      ) : null}

      {draft && section.key === 'vaccination' ? (
        <VaccinationEntryCard
          entry={draft as VaccinationEntryState}
          index={0}
          accentColor={brandColor}
          accentBg={brandBg}
          canRemove={false}
          embeddedInSheet
          onChange={(next) => handleChange(next)}
          onRemove={() => {}}
        />
      ) : null}

      {draft && section.key === 'grooming' ? (
        <GroomingEntryCard
          entry={draft as GroomingEntryState}
          index={0}
          accentColor={brandColor}
          accentBg={brandBg}
          typeOptions={groomingTypeOptions}
          canRemove={false}
          embeddedInSheet
          onChange={(next) => handleChange(next)}
          onRemove={() => {}}
        />
      ) : null}
    </FormSheetShell>
  );
}
