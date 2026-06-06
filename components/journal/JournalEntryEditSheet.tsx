import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import { deleteJournalEntry, updateJournalEntry } from '@/services/journal/journalApi';
import type { ApiJournalEntry } from '@/types/journal';

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
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && entry) {
      setNote(entry.note ?? '');
      setActivityType(entry.activityType ?? 'General');
      setError(null);
    }
  }, [visible, entry]);

  const handleSave = async () => {
    if (!token || !entry) return;
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
    if (!token || !entry) return;
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={SheetColors.title}>
              Edit Entry
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={HomeTheme.text} />
            </TouchableOpacity>
          </View>

          {error ? <AuthErrorBanner message={error} /> : null}

          <SectionLabel text="ACTIVITY TYPE" />
          <TextInput
            value={activityType}
            onChangeText={setActivityType}
            style={styles.input}
            placeholder="feeding, walk, medicine..."
            placeholderTextColor={SheetColors.placeholder}
          />

          <SectionLabel text="NOTE" />
          <TextInput
            value={note}
            onChangeText={setNote}
            style={[styles.input, styles.notesInput]}
            placeholder="What happened?"
            placeholderTextColor={SheetColors.placeholder}
            multiline
            textAlignVertical="top"
          />

          <AppButton
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            disabled={deleting}
            variant="success"
            size="md"
            style={styles.saveBtn}
          />
          <AppButton
            title="Delete Entry"
            onPress={handleDelete}
            loading={deleting}
            disabled={saving}
            variant="outline"
            size="md"
            style={styles.deleteBtn}
            textStyle={styles.deleteText}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  notesInput: {
    minHeight: 88,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  deleteBtn: {
    width: '100%',
    borderRadius: Radius.full,
    borderColor: '#E53935',
    marginBottom: Spacing.sm,
  },
  deleteText: {
    color: '#E53935',
  },
});
