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
import { ThemedDatePicker } from '@/components/pet/ThemedDatePicker';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/errors';
import {
  dateToApiDateString,
  formatDateLabel,
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
  const insets = useSafeAreaInsets();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3" weight="800" color={SheetColors.title}>
              Manage Grooming
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={HomeTheme.text} />
            </TouchableOpacity>
          </View>

          {record ? (
            <AppText variant="bodySmall" color={HomeTheme.textMuted} style={styles.subtitle}>
              {record.groomingType}
            </AppText>
          ) : null}

          {error ? <AuthErrorBanner message={error} /> : null}

          <SectionLabel text="SCHEDULED DATE" />
          <TouchableOpacity style={styles.dateField} onPress={() => setPickerVisible(true)}>
            <AppText variant="bodySmall" color={SheetColors.inputText}>
              {scheduledDate ? formatDateLabel(scheduledDate) : 'Select date'}
            </AppText>
            <Ionicons name="calendar-outline" size={18} color={HomeTheme.textMuted} />
          </TouchableOpacity>

          <SectionLabel text="NOTES" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.notesInput]}
            placeholder="Notes"
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
            title="Delete Task"
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
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
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
