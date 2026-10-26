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

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="trophy-outline" size={20} color="#D4A017" />
            </View>
            <View style={styles.headerTitles}>
              <AppText variant="h3" weight="800" color={Palette.primary.base}>
                Household Walking Goals
              </AppText>
              <AppText variant="caption" color={Palette.gray[600]}>
                Set weekly activity targets for your care team
              </AppText>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="caption" weight="700" color={Palette.gray[700]}>
              Weekly Walking Target (Minutes)
            </AppText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weeklyMinutes}
              onChangeText={setWeeklyMinutes}
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="caption" weight="700" color={Palette.gray[700]}>
              Weekly Target Distance (Km)
            </AppText>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={weeklyKm}
              onChangeText={setWeeklyKm}
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText variant="caption" weight="700" color={Palette.gray[700]}>
              Daily Minimum Walks Count
            </AppText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={dailyWalks}
              onChangeText={setDailyWalks}
            />
          </View>

          {/* Action Buttons */}
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
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    gap: Spacing.sm,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.gray[300],
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  inputGroup: {
    gap: 4,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: Palette.gray[900],
    borderWidth: 1,
    borderColor: '#EEEEEE',
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
    backgroundColor: '#F5F5F5',
  },
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary.base,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
