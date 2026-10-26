import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { DelegationTask } from '@/types/delegation';

interface CompleteTaskModalProps {
  visible: boolean;
  task: DelegationTask | null;
  onClose: () => void;
  onComplete: (walkMetrics?: { durationMinutes: number; distanceKm: number }, notes?: string) => void;
  completing?: boolean;
}

export function CompleteTaskModal({
  visible,
  task,
  onClose,
  onComplete,
  completing = false,
}: CompleteTaskModalProps) {
  const [duration, setDuration] = useState('25');
  const [distance, setDistance] = useState('1.5');
  const [notes, setNotes] = useState('');

  if (!task) return null;

  const isWalk = task.category === 'walk';

  const handleComplete = () => {
    if (isWalk) {
      onComplete(
        {
          durationMinutes: Number(duration) || 0,
          distanceKm: Number(distance) || 0,
        },
        notes.trim()
      );
    } else {
      onComplete(undefined, notes.trim());
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-done" size={24} color="#2E7D32" />
            </View>
            <View style={styles.headerTitles}>
              <AppText variant="h3" weight="800" color="#184F2E">
                Complete Chore
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                “{task.title || task.category}” for your pet
              </AppText>
            </View>
          </View>

          {isWalk ? (
            <View style={styles.walkInputsContainer}>
              <AppText variant="caption" weight="800" color="#184F2E" style={styles.sectionLabel}>
                WALK ACTIVITY METRICS
              </AppText>
              <View style={styles.walkRow}>
                <View style={styles.inputBox}>
                  <AppText variant="caption" color={Palette.gray[600]}>
                    Duration (Minutes)
                  </AppText>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>

                <View style={styles.inputBox}>
                  <AppText variant="caption" color={Palette.gray[600]}>
                    Distance (Km)
                  </AppText>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="decimal-pad"
                    value={distance}
                    onChangeText={setDistance}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* Notes */}
          <AppText variant="caption" weight="800" color="#184F2E" style={styles.sectionLabel}>
            NOTES / OBSERVATIONS (OPTIONAL)
          </AppText>
          <TextInput
            style={styles.textInput}
            placeholder={isWalk ? "e.g., Milo enjoyed walking near the park!" : "e.g., Ate full breakfast eagerly."}
            placeholderTextColor={Palette.gray[400]}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={120}
          />

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText variant="bodySmall" weight="700" color={Palette.gray[700]}>
                Cancel
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.completeBtn, completing && styles.btnDisabled]}
              onPress={handleComplete}
              activeOpacity={0.8}
              disabled={completing}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <AppText variant="bodySmall" weight="800" color="#FFFFFF">
                {completing ? 'Recording...' : 'Mark as Done'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    gap: Spacing.sm,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerTitles: {
    flex: 1,
  },
  sectionLabel: {
    letterSpacing: 0.5,
    marginTop: 4,
    fontSize: 11,
  },
  walkInputsContainer: {
    gap: Spacing.xs,
    marginTop: 2,
  },
  walkRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputBox: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    padding: Spacing.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  numberInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#184F2E',
    marginTop: 2,
  },
  textInput: {
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    padding: Spacing.md,
    fontSize: 14,
    color: Palette.gray[900],
    minHeight: 64,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
  },
  completeBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: '#2E7D32',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
