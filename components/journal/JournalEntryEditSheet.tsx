import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CustomButton } from '@/components/ui/AppButton';
import {
  FormSheetShell,
  FormTextInput,
} from '@/components/sheets';
import { getErrorMessage } from '@/lib/api/errors';
import { deleteJournalEntry, updateJournalEntry } from '@/services/journal/journalApi';
import type { ApiJournalEntry } from '@/types/journal';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';

interface JournalEntryEditSheetProps {
  visible: boolean;
  entry: ApiJournalEntry | null;
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function JournalEntryEditSheet({
  visible,
  entry,
  token,
  onClose,
  onSaved,
}: JournalEntryEditSheetProps) {
  const { canEdit, loading: permissionsLoading } = usePermissionGuard(entry?.petId || (entry as any)?.pet, 'journal');
  const resolvedReadOnly = !canEdit;

  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (visible && entry) {
      setNote(entry.note ?? '');
      setActivityType(entry.activityType ?? 'General');
      setError(null);
    }
  }, [visible, entry]);

  const handleSave = async () => {
    if (!canEdit) {
      showToast("Read-only access: You cannot modify this entry.");
      return;
    }
    if (!token || !entry || resolvedReadOnly) return;
    setSaving(true);
    setError(null);
    try {
      await updateJournalEntry(token, entry._id, {
        note: note.trim(),
        activityType: activityType.trim() || 'General',
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      showToast("Read-only access: You cannot modify this entry.");
      return;
    }
    if (!token || !entry || resolvedReadOnly) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteJournalEntry(token, entry._id);
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (permissionsLoading) {
    return (
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title="Edit Journal Entry"
        icon="book-open"
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
      title="Edit Journal Entry"
      icon="book-open"
      saveLabel={resolvedReadOnly ? undefined : "Save Changes"}
      onSave={handleSave}
      saving={saving}
      saveDisabled={deleting || resolvedReadOnly}
      error={error}
      isReadOnly={resolvedReadOnly}
      compact
    >
      <FormTextInput
        label="Activity Type"
        value={activityType}
        onChangeText={setActivityType}
        placeholder="feeding, walk, medicine..."
      />

      <FormTextInput
        label="Note"
        value={note}
        onChangeText={setNote}
        placeholder="What happened?"
        multiline
      />

      {!resolvedReadOnly ? (
        <View style={styles.deleteSection}>
          <CustomButton
            title="Delete Journal Entry"
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
