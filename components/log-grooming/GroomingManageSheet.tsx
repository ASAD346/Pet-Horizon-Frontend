import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import {
  FormDateInput,
  FormSheetShell,
  FormTextInput,
} from '@/components/sheets';
import { CustomButton } from '@/components/ui/AppButton';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api/errors';
import {
  dateToApiDateString,
} from '@/lib/grooming/groomingForm';
import {
  deleteGroomingRecord,
  updateGroomingRecord,
} from '@/services/grooming/groomingApi';
import type { GroomingRecord } from '@/types/grooming';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

interface GroomingManageSheetProps {
  visible: boolean;
  record: GroomingRecord | null;
  token: string | null;
  onClose: () => void;
  onUpdated: () => void;
  isReadOnly?: boolean;
}

export function GroomingManageSheet({
  visible,
  record,
  token,
  onClose,
  onUpdated,
  isReadOnly = false,
}: GroomingManageSheetProps) {
  const { canEdit } = usePermissionGuard(record?.petId, 'grooming');
  const resolvedReadOnly = isReadOnly || !canEdit;

  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    if (visible && record) {
      setNotes(record.notes ?? '');
      setScheduledDate(record.scheduledDate ? new Date(record.scheduledDate) : new Date());
      setError(null);
    }
  }, [visible, record]);

  const handleSave = () => {
    if (!token || !record || resolvedReadOnly) return;
    Alert.alert(
      "Modify Schedule?",
      "Are you sure you want to proceed with this action? This change cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Modify",
          style: "default",
          onPress: async () => {
            setSaving(true);
            try {
              await updateGroomingRecord(token, record._id, {
                notes: notes.trim(),
                scheduledDate: scheduledDate ? dateToApiDateString(scheduledDate) : null,
              });
              showSuccessToast("Grooming task modified successfully.");
              onUpdated();
              onClose();
            } catch (err: any) {
              const errMsg = err?.message || getErrorMessage(err) || "Failed to update record.";
              setError(errMsg);
              showErrorToast(errMsg);
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    if (!token || !record || resolvedReadOnly) return;
    Alert.alert(
      "Remove Task?",
      "Are you sure you want to delete this grooming task? This change is permanent.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteGroomingRecord(token, record._id);
              showSuccessToast("Grooming task deleted successfully.");
              onUpdated();
              onClose();
            } catch (err: any) {
              const errMsg = err?.message || getErrorMessage(err) || "Failed to delete record.";
              setError(errMsg);
              showErrorToast(errMsg);
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title="Grooming settings"
        subtitle={record?.groomingType ?? 'Grooming Record'}
        icon="content-cut"
        saveLabel={resolvedReadOnly ? undefined : "Save changes"}
        onSave={resolvedReadOnly ? undefined : handleSave}
        saving={saving}
        saveDisabled={deleting}
        error={error}
        compact
      >
        <View pointerEvents={resolvedReadOnly ? "none" : "auto"} style={resolvedReadOnly ? styles.readOnlyContainer : null}>
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
        </View>

        {!resolvedReadOnly ? (
          <View style={styles.deleteSection}>
            <CustomButton
              title="Delete Grooming Task"
              onPress={handleDelete}
              isLoading={deleting}
              disabled={saving}
              variant="outline"
              style={styles.deleteBtn}
              textStyle={styles.deleteText}
            />
          </View>
        ) : null}
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
  readOnlyContainer: {
    opacity: 0.65,
  },
});
