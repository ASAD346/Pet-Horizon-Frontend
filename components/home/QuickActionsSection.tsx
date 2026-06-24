import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AppText } from '../ui/AppText';
import { SectionHeader } from './SectionHeader';
import { QUICK_ACTION_MODULES } from '@/lib/pet/petPermissionAccess';
import type { AppModuleId } from '@/lib/pet/petPermissionAccess';
import { HomeTheme, Spacing } from '../../constants/theme';

type ActionIcon = 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut' | 'needle';

interface ActionItem {
  label: string;
  displayLabel: string;
  icon: ActionIcon;
  colors: [string, string];
  tint: string;
  plusBg: string;
  subText: string;
}

const ACTIONS: ActionItem[] = [
  {
    label: 'Log Food',
    displayLabel: 'Food',
    icon: 'silverware-fork-knife',
    colors: ['#FFF8F0', '#FFEEDB'],
    tint: '#E65100',
    plusBg: 'rgba(230, 81, 0, 0.08)',
    subText: 'Log meal',
  },
  {
    label: 'Log Walk',
    displayLabel: 'Walk',
    icon: 'walk',
    colors: ['#F1F9F1', '#E1F3E2'],
    tint: '#1B5E20',
    plusBg: 'rgba(27, 94, 32, 0.08)',
    subText: 'Track route',
  },
  {
    label: 'Medicine',
    displayLabel: 'Meds',
    icon: 'pill',
    colors: ['#F0F7FF', '#E1F0FF'],
    tint: '#0D47A1',
    plusBg: 'rgba(13, 71, 161, 0.08)',
    subText: 'Add dose',
  },
  {
    label: 'Grooming',
    displayLabel: 'Grooming',
    icon: 'content-cut',
    colors: ['#FFF0F6', '#FFE1F0'],
    tint: '#880E4F',
    plusBg: 'rgba(136, 14, 79, 0.08)',
    subText: 'Style pet',
  },
  {
    label: 'Vaccination',
    displayLabel: 'Vaccine',
    icon: 'needle',
    colors: ['#F6F0FF', '#EBE0FF'],
    tint: '#4A148C',
    plusBg: 'rgba(74, 20, 140, 0.08)',
    subText: 'Add shot',
  },
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

  const handlePress = (onPress?: () => void) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    }
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Quick Actions" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {visibleActions.map((action) => {
          const handlerKey = ACTION_HANDLERS[action.label];
          const onPress = handlerKey ? handlers[handlerKey] : undefined;

          return (
            <TouchableOpacity
              key={action.label}
              activeOpacity={0.8}
              onPress={() => handlePress(onPress)}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={action.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tileCard}
              >
                {/* Header elements: Icon container on left, plus icon on right */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.75)' }]}>
                    <MaterialCommunityIcons name={action.icon} size={20} color={action.tint} />
                  </View>
                  <View style={[styles.plusButton, { backgroundColor: action.plusBg }]}>
                    <Feather name="plus" size={12} color={action.tint} style={styles.plusIcon} />
                  </View>
                </View>

                {/* Footer elements: Action title and subtext */}
                <View style={styles.textContainer}>
                  <AppText variant="bodySmall" weight="800" color={action.tint} style={styles.label}>
                    {action.displayLabel}
                  </AppText>
                  <AppText variant="caption" weight="500" color={action.tint} style={styles.subLabel}>
                    {action.subText}
                  </AppText>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  scrollContainer: {
    paddingLeft: 4,
    paddingRight: Spacing.md,
    paddingVertical: 8,
    gap: 12,
  },
  cardWrapper: {
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tileCard: {
    width: 96,
    height: 104,
    borderRadius: 20,
    padding: 10,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontWeight: 'bold',
  },
  textContainer: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
    marginBottom: 1,
  },
  subLabel: {
    fontSize: 9,
    lineHeight: 11,
    opacity: 0.6,
  },
});

