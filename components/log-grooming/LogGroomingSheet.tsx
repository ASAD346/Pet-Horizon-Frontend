import { getErrorMessage } from '@/lib/api/errors';
import {
  defaultScheduledDate,
} from '@/lib/grooming/groomingForm';
import { log } from '@/lib/log';
import { LOG_SHEET_THEMES } from '@/lib/log/logSheetThemes';
import {
  buildGroomingDatePayload,
  createDefaultScheduleDate,
  validateScheduleDate,
} from '@/lib/schedule/scheduleDate';
import { createGroomingRecord, fetchGroomingTypes, groomingTypesCache } from '@/services/grooming/groomingApi';
import type { GroomingTypeOption } from '@/types/grooming';
import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { SkeletonChipGrid } from '@/components/ui/skeletons';
import { FormSheetShell } from '../sheets';
import { AppText } from '../ui/AppText';
import { HomeTheme } from '../../constants/theme';
import { GroomingEntryCard } from '../schedule/entries/GroomingEntryCard';
import type { GroomingEntryState } from '@/lib/schedule/types';
import { saveScheduleEntry } from '@/lib/schedule/saveScheduleEntry';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Skeleton } from '@/components/ui/Skeleton';
import { View } from 'react-native';

const GROOMING_THEME = LOG_SHEET_THEMES.grooming;

interface LogGroomingSheetProps {
  visible: boolean;
  onClose: () => void;
  petId: string | null;
  token: string | null;
  onSaved?: () => void;
  initialEntry?: GroomingEntryState | null;
  typeOptions?: GroomingTypeOption[];
  groomingVisible?: boolean;
  isReadOnly?: boolean;
}

export function LogGroomingSheet({
  visible,
  onClose,
  petId,
  token,
  onSaved,
  initialEntry,
  typeOptions: propsTypeOptions,
  groomingVisible: propsGroomingVisible = true,
  isReadOnly = false,
}: LogGroomingSheetProps) {
  const { canEdit, loading: permissionsLoading } = usePermissionGuard(petId, 'grooming');
  const resolvedReadOnly = isReadOnly || !canEdit;

  const [typeOptions, setTypeOptions] = useState<GroomingTypeOption[]>([]);
  const [groomingVisible, setGroomingVisible] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [entry, setEntry] = useState<GroomingEntryState>(() => initialEntry ?? {
    id: 'draft',
    groomingType: '',
    scheduleDate: {
      ...createDefaultScheduleDate('single'),
      singleDate: defaultScheduledDate(),
    },
    reminderOn: true,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { showToast, showErrorToast } = useToast();

  const loadTypes = useCallback(async () => {
    if (propsTypeOptions?.length) {
      setTypeOptions(propsTypeOptions);
      setGroomingVisible(propsGroomingVisible);
      setEntry((prev) => ({
        ...prev,
        groomingType: prev.groomingType || (propsTypeOptions[0]?.value ?? ''),
      }));
      setLoadingTypes(false);
      return;
    }

    if (!petId || !token) {
      setTypeOptions([]);
      setGroomingVisible(true);
      return;
    }

    // Try reading from cache first for instant loading
    const cacheKey = `${token}:${petId}`;
    if (groomingTypesCache[cacheKey]) {
      const data = groomingTypesCache[cacheKey];
      setGroomingVisible(data.groomingVisible);
      setTypeOptions(data.types ?? []);
      setEntry((prev) => ({
        ...prev,
        groomingType: prev.groomingType || (data.types?.[0]?.value ?? ''),
      }));
      setLoadingTypes(false);
      return;
    }

    setLoadingTypes(true);
    try {
      const data = await fetchGroomingTypes(token, petId);
      setGroomingVisible(data.groomingVisible);
      setTypeOptions(data.types ?? []);
      setEntry((prev) => ({
        ...prev,
        groomingType: prev.groomingType || (data.types?.[0]?.value ?? ''),
      }));
    } catch (e) {
      setTypeOptions([]);
      showErrorToast(getErrorMessage(e));
    } finally {
      setLoadingTypes(false);
    }
  }, [petId, token, propsTypeOptions, propsGroomingVisible, showErrorToast]);

  const resetForm = useCallback(() => {
    if (initialEntry) {
      setEntry({ ...initialEntry });
    } else {
      setEntry({
        id: 'draft',
        groomingType: '',
        scheduleDate: { ...createDefaultScheduleDate('single'), singleDate: defaultScheduledDate() },
        reminderOn: true,
        notes: '',
      });
    }
  }, [initialEntry]);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadTypes();
    }
  }, [visible, resetForm, loadTypes]);

  const handleSave = async () => {
    if (!canEdit) {
      showToast("Read-only access: You cannot modify this entry.");
      return;
    }
    if (saving || resolvedReadOnly) return;
    if (!petId || !token) {
      showErrorToast('Add a pet before saving a grooming task.');
      return;
    }
    if (!groomingVisible) {
      showErrorToast('Grooming is not available for this pet species.');
      return;
    }
    if (!entry.groomingType) {
      showErrorToast('Select a grooming type.');
      return;
    }
    const dateError = validateScheduleDate(entry.scheduleDate);
    if (dateError) {
      showErrorToast(dateError);
      return;
    }

    setSaving(true);
    try {
      await saveScheduleEntry(token, petId, 'grooming', entry, { groomingVisible });
      const isEdit = Boolean(entry.recordId);
      log.ok('LogGrooming', isEdit ? 'Grooming record updated' : 'Grooming record saved', {
        type: entry.groomingType,
      });
      showToast(isEdit ? 'Grooming schedule updated successfully!' : 'Grooming logged successfully!');
      onSaved?.();
      onClose();
    } catch (e) {
      showErrorToast(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (permissionsLoading) {
    return (
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title={entry.recordId ? 'Edit Grooming' : 'Log Grooming'}
        icon={GROOMING_THEME.icon}
        accentColor={GROOMING_THEME.color}
        accentBg={GROOMING_THEME.bg}
        saveLabel={undefined}
        onSave={undefined}
        saving={false}
        error={null}
        isReadOnly={true}
        compact
      >
        <View style={{ padding: 16, gap: 16 }}>
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={48} borderRadius={8} />
          <Skeleton width="30%" height={16} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={48} borderRadius={8} />
        </View>
      </FormSheetShell>
    );
  }

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title={entry.recordId ? 'Edit Grooming' : 'Log Grooming'}
      icon={GROOMING_THEME.icon}
      accentColor={GROOMING_THEME.color}
      accentBg={GROOMING_THEME.bg}
      saveLabel={resolvedReadOnly ? undefined : (entry.recordId ? 'Save Changes' : 'Save Grooming')}
      onSave={handleSave}
      saving={saving}
      saveDisabled={loadingTypes || !groomingVisible || !entry.groomingType || resolvedReadOnly}
      isReadOnly={resolvedReadOnly}
      compact
    >
      {loadingTypes ? (
        <SkeletonChipGrid count={4} />
      ) : !groomingVisible ? (
        <AppText variant="bodySmall" color={HomeTheme.textMuted} style={{ marginVertical: 12 }}>
          Grooming is not available for this pet species.
        </AppText>
      ) : (
        <GroomingEntryCard
          entry={entry}
          index={0}
          accentColor={GROOMING_THEME.color}
          accentBg={GROOMING_THEME.bg}
          typeOptions={typeOptions}
          canRemove={false}
          embeddedInSheet
          onChange={setEntry}
          onRemove={() => {}}
        />
      )}
    </FormSheetShell>
  );
}
