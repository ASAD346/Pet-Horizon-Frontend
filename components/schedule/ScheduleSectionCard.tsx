import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme } from '@/constants/theme';
import { scheduleFieldStyles } from './scheduleStyles';
import { type ScheduleSectionTheme } from './scheduleTheme';
import { useAuth } from '@/hooks/useAuth';

interface ScheduleSectionCardProps {
  section: ScheduleSectionTheme;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  canEdit?: boolean;
  children?: React.ReactNode;
}

export function ScheduleSectionCard({
  section,
  enabled,
  onToggle,
  canEdit = true,
  children,
}: ScheduleSectionCardProps) {
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';
  const brandColor = isPremium ? '#184F2E' : '#3A8F3B';
  const brandBg = isPremium ? '#E8F5E9' : '#EEF8EE';

  return (
    <View style={scheduleFieldStyles.sectionCard}>
      <View style={scheduleFieldStyles.sectionHeader}>
        <View
          style={[scheduleFieldStyles.sectionIconWrap, { backgroundColor: brandBg }]}
        >
          <MaterialCommunityIcons name={section.icon} size={22} color={brandColor} />
        </View>
        <View style={styles.titleBlock}>
          <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
            {section.title}
          </AppText>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={!canEdit}
          trackColor={{ false: '#E2E8F0', true: brandColor }}
          thumbColor={HomeTheme.white}
          ios_backgroundColor="#E2E8F0"
        />
      </View>
      {enabled && children ? (
        <View style={[scheduleFieldStyles.sectionBody, { backgroundColor: '#F8FAF8', paddingBottom: 28 }]}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    flex: 1,
  },
});
