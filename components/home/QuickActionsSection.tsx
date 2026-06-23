import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SectionHeader } from './SectionHeader';
import { QUICK_ACTION_MODULES } from '@/lib/pet/petPermissionAccess';
import type { AppModuleId } from '@/lib/pet/petPermissionAccess';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

type ActionIcon = 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' | 'needle';

const ACTIONS: { label: string; icon: ActionIcon; color: string; bg: string }[] = [
  { label: 'Log Food', icon: 'silverware-fork-knife', color: '#F5A623', bg: 'rgba(245, 166, 35, 0.08)' },
  { label: 'Log Walk', icon: 'walk', color: '#5CB35D', bg: 'rgba(92, 179, 93, 0.08)' },
  { label: 'Medicine', icon: 'pill', color: '#5B9BD5', bg: 'rgba(91, 155, 213, 0.08)' },
  { label: 'Grooming', icon: 'content-cut', color: '#E91E8C', bg: 'rgba(233, 30, 140, 0.08)' },
  { label: 'Vaccination', icon: 'needle', color: '#673AB7', bg: 'rgba(103, 58, 183, 0.08)' },
];

interface QuickActionsSectionProps {
  onLogFoodPress?: () => void;
  onLogWalkPress?: () => void;
  onMedicinePress?: () => void;
  onGroomingPress?: () => void;
  onVaccinationPress?: () => void;
  groomingVisible?: boolean;
  canView?: (moduleId: AppModuleId) => boolean;
  canEdit?: (moduleId: AppModuleId) => boolean;
}

const ACTION_HANDLERS: Record<
  string,
  'onLogFoodPress' | 'onLogWalkPress' | 'onMedicinePress' | 'onGroomingPress' | 'onVaccinationPress'
> = {
  'Log Food': 'onLogFoodPress',
  'Log Walk': 'onLogWalkPress',
  Medicine: 'onMedicinePress',
  Grooming: 'onGroomingPress',
  Vaccination: 'onVaccinationPress',
};

export function QuickActionsSection({
  onLogFoodPress,
  onLogWalkPress,
  onMedicinePress,
  onGroomingPress,
  onVaccinationPress,
  groomingVisible = true,
  canView,
  canEdit,
}: QuickActionsSectionProps) {
  const handlers = {
    onLogFoodPress,
    onLogWalkPress,
    onMedicinePress,
    onGroomingPress,
    onVaccinationPress,
  };

  const visibleActions = ACTIONS.filter((action) => {
    if (action.label === 'Grooming' && !groomingVisible) return false;
    const moduleId = QUICK_ACTION_MODULES[action.label];
    if (!moduleId) return true;
    if (canEdit) return canEdit(moduleId);
    if (canView) return canView(moduleId);
    return true;
  });

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Quick Actions" />
      <View style={styles.panelCard}>
        {visibleActions.map((action) => {
          const handlerKey = ACTION_HANDLERS[action.label];
          const onPress = handlerKey ? handlers[handlerKey] : undefined;

          return (
            <TouchableOpacity
              key={action.label}
              style={styles.tile}
              activeOpacity={0.7}
              onPress={onPress}
            >
              <View style={[styles.innerBadge, { backgroundColor: action.bg }]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>
              <AppText variant="caption" weight="800" color="#1A2B4E" style={styles.label}>
                {action.label.replace('Log ', '')}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  panelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    ...cardShadow,
  },
  tile: {
    alignItems: 'center',
    flex: 1,
  },
  innerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
});
