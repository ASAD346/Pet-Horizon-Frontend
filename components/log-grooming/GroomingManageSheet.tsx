import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import {
  FormSheetShell,
  FormDateInput,
  FormTextInput,
} from '@/components/sheets';
import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import { getErrorMessage } from '@/lib/api/errors';
import {
  dateToApiDateString,
} from '@/lib/grooming/groomingForm';
import {
  deleteGroomingRecord,
  updateGroomingRecord,
} from '@/services/grooming/groomingApi';
import type { GroomingRecord } from '@/types/grooming';

interface GroomingManageSheetProps {
  visible: boolean;
  record: GroomingRecord | null;
  token: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function GroomingManageSheet({
  visible,
  record,
  token,
  onClose,
  onUpdated,
}: GroomingManageSheetProps) {
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && record) {
      setNotes(record.notes ?? '');
      setScheduledDate(record.scheduledDate ? new Date(record.scheduledDate) : new Date());
      setError(null);
    }
  }, [visible, record]);

  const handleSave = async () => {
    if (!token || !record) return;
    setSaving(true);
    setError(null);
    try {
      await updateGroomingRecord(token, record._id, {
        notes: notes.trim(),
        scheduledDate: scheduledDate ? dateToApiDateString(scheduledDate) : null,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !record) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteGroomingRecord(token, record._id);
      onUpdated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title="Manage Grooming"
        subtitle={record?.groomingType ?? 'Edit scheduled task'}
        icon="content-cut"
        saveLabel="Save Changes"
        onSave={handleSave}
        saving={saving}
        saveDisabled={deleting}
        error={error}
        compact
      >
        <FormDateInput
          label="Scheduled Date"
          value={scheduledDate ?? new Date()}
          onPress={() => setPickerVisible(true)}
        />

        <FormTextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          multiline
        />

        <View style={styles.deleteSection}>
          <AppButton
            title="Delete Grooming Task"
            onPress={handleDelete}
            loading={deleting}
            disabled={saving}
            variant="outline"
            size="sm"
            style={styles.deleteBtn}
            textStyle={styles.deleteText}
          />
        </View>
      </FormSheetShell>

      <ThemedDatePicker
        visible={pickerVisible}
        title="Scheduled date"
        value={scheduledDate ?? new Date()}
        onClose={() => setPickerVisible(false)}
        onConfirm={(date) => {
          setScheduledDate(date);
          setPickerVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  deleteSection: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  deleteBtn: {
    width: '100%',
    borderColor: '#E53935',
    borderWidth: 1.5,
  },
  deleteText: {
    color: '#E53935',
    fontWeight: '700',
  },
});
