import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import type { GroomingTypeOption } from '@/types/grooming';
import type {
  FeedingEntryState,
  GroomingEntryState,
  MedicineEntryState,
  VaccinationEntryState,
  WalkEntryState,
} from '@/lib/schedule/types';
import { sectionDisplayTitle, type ScheduleSectionTheme } from './scheduleTheme';
import { FeedingEntryCard } from './entries/FeedingEntryCard';
import { WalkEntryCard } from './entries/WalkEntryCard';
import { MedicineEntryCard } from './entries/MedicineEntryCard';
import { VaccinationEntryCard } from './entries/VaccinationEntryCard';
import { GroomingEntryCard } from './entries/GroomingEntryCard';

type EditorEntry =
  | FeedingEntryState
  | WalkEntryState
  | MedicineEntryState
  | VaccinationEntryState
  | GroomingEntryState;

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
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<EditorEntry | null>(entry);

  useEffect(() => {
    if (visible) setDraft(entry);
  }, [visible, entry]);

  const handleChange = (next: EditorEntry) => {
    setDraft(next);
    onChange(next);
  };

  const title =
    mode === 'add'
      ? section.addLabel
      : `Edit ${sectionDisplayTitle(section).replace(/\s*\(Optional\)$/i, '')}`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12} disabled={saving}>
              <AppText variant="body" weight="600" color={HomeTheme.textMuted}>
                Cancel
              </AppText>
            </TouchableOpacity>
            <AppText variant="h3" weight="800" color={SheetColors.title}>
              {title}
            </AppText>
            <View style={styles.headerSpacer} />
          </View>

          {error ? (
            <View style={styles.banner}>
              <AuthErrorBanner message={error} />
            </View>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {draft && section.key === 'feeding' ? (
              <FeedingEntryCard
                entry={draft as FeedingEntryState}
                index={0}
                accentColor={section.color}
                mealTypeOptions={mealTypeOptions}
                unitOptions={unitOptions}
                canRemove={false}
                onChange={(next) => handleChange(next)}
                onRemove={() => {}}
              />
            ) : null}

            {draft && section.key === 'walk' ? (
              <WalkEntryCard
                entry={draft as WalkEntryState}
                index={0}
                accentColor={section.color}
                canRemove={false}
                onChange={(next) => handleChange(next)}
                onRemove={() => {}}
              />
            ) : null}

            {draft && section.key === 'medicine' ? (
              <MedicineEntryCard
                entry={draft as MedicineEntryState}
                index={0}
                accentColor={section.color}
                canRemove={false}
                onChange={(next) => handleChange(next)}
                onRemove={() => {}}
              />
            ) : null}

            {draft && section.key === 'vaccination' ? (
              <VaccinationEntryCard
                entry={draft as VaccinationEntryState}
                index={0}
                accentColor={section.color}
                canRemove={false}
                onChange={(next) => handleChange(next)}
                onRemove={() => {}}
              />
            ) : null}

            {draft && section.key === 'grooming' ? (
              <GroomingEntryCard
                entry={draft as GroomingEntryState}
                index={0}
                accentColor={section.color}
                accentBg={section.bg}
                typeOptions={groomingTypeOptions}
                canRemove={false}
                onChange={(next) => handleChange(next)}
                onRemove={() => {}}
              />
            ) : null}
          </ScrollView>

          <AppButton
            title={mode === 'add' ? 'Add Schedule' : 'Save Changes'}
            onPress={onSave}
            loading={saving}
            disabled={saving || !draft}
            variant="success"
            size="md"
            style={[styles.saveBtn, { backgroundColor: section.color }]}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '92%',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8D8D8',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerSpacer: {
    width: 56,
  },
  banner: {
    marginBottom: Spacing.sm,
  },
  scroll: {
    maxHeight: Platform.OS === 'web' ? 520 : undefined,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 52,
    marginTop: Spacing.sm,
  },
});
