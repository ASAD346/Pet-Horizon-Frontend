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
  { label: 'Log Food', icon: 'silverware-fork-knife', color: '#F5A623', bg: '#FFF4E0' },
  { label: 'Log Walk', icon: 'walk', color: '#5CB35D', bg: '#E8F5E9' },
  { label: 'Medicine', icon: 'pill', color: '#5B9BD5', bg: '#E3F2FD' },
  { label: 'Grooming', icon: 'content-cut', color: '#E91E8C', bg: '#FCE4F0' },
  { label: 'Vaccination', icon: 'needle', color: '#673AB7', bg: '#EDE7F6' },
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
      <View style={styles.row}>
        {visibleActions.map((action) => {
          const handlerKey = ACTION_HANDLERS[action.label];
          const onPress = handlerKey ? handlers[handlerKey] : undefined;

          return (
            <TouchableOpacity
              key={action.label}
              style={styles.tile}
              activeOpacity={0.85}
              onPress={onPress}
            >
              <View style={[styles.iconBox, { backgroundColor: action.bg }]}>
                <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
              </View>
              <AppText variant="caption" weight="600" color={HomeTheme.text} style={styles.label}>
                {action.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tileShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tile: {
    alignItems: 'center',
    width: '18%',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...tileShadow,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
});
