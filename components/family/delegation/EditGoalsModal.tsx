import React, { useState, useEffect } from 'react';
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
import type { FamilyGoalStats } from '@/types/delegation';

interface EditGoalsModalProps {
  visible: boolean;
  stats: FamilyGoalStats | null;
  onClose: () => void;
  onSave: (goals: { weeklyTargetMinutes: number; weeklyTargetKm: number; dailyMinimumWalkCount: number }) => void;
  saving?: boolean;
}

export function EditGoalsModal({
  visible,
  stats,
  onClose,
  onSave,
  saving = false,
}: EditGoalsModalProps) {
  const [weeklyMinutes, setWeeklyMinutes] = useState('150');
  const [weeklyKm, setWeeklyKm] = useState('10');
  const [dailyWalks, setDailyWalks] = useState('2');

  useEffect(() => {
    if (stats?.walkingGoal) {
      setWeeklyMinutes(String(stats.walkingGoal.weeklyTargetMinutes || 150));
      setWeeklyKm(String(stats.walkingGoal.weeklyTargetKm || 10));
      setDailyWalks(String(stats.walkingGoal.dailyMinimumWalkCount || 2));
    }
  }, [stats]);

  const handleSave = () => {
    onSave({
      weeklyTargetMinutes: Number(weeklyMinutes) || 150,
      weeklyTargetKm: Number(weeklyKm) || 10,
      dailyMinimumWalkCount: Number(dailyWalks) || 2,
    });
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
              <Ionicons name="trophy-outline" size={22} color="#D4A017" />
            </View>
            <View style={styles.headerTitles}>
              <AppText variant="h3" weight="800" color="#184F2E">
                Household Walking Goals
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                Customize weekly activity targets for your care circle
              </AppText>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="caption" weight="800" color="#184F2E" style={styles.inputLabel}>
              WEEKLY WALKING TARGET (MINUTES)
            </AppText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weeklyMinutes}
              onChangeText={setWeeklyMinutes}
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="caption" weight="800" color="#184F2E" style={styles.inputLabel}>
              WEEKLY TARGET DISTANCE (KM)
            </AppText>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={weeklyKm}
              onChangeText={setWeeklyKm}
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="caption" weight="800" color="#184F2E" style={styles.inputLabel}>
              DAILY MINIMUM WALKS COUNT
            </AppText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={dailyWalks}
              onChangeText={setDailyWalks}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText variant="bodySmall" weight="700" color={Palette.gray[700]}>
                Cancel
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              <AppText variant="bodySmall" weight="800" color="#FFFFFF">
                {saving ? 'Saving...' : 'Save Goals'}
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
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  headerTitles: {
    flex: 1,
  },
  inputGroup: {
    gap: 4,
    marginTop: 2,
  },
  inputLabel: {
    letterSpacing: 0.5,
    fontSize: 11,
  },
  input: {
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#184F2E',
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
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: '#2E7D32',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
