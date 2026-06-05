import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme } from '@/constants/theme';
import { scheduleFieldStyles } from './scheduleStyles';
import { sectionDisplayTitle, type ScheduleSectionTheme } from './scheduleTheme';

interface ScheduleSectionCardProps {
  section: ScheduleSectionTheme;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  children?: React.ReactNode;
}

export function ScheduleSectionCard({
  section,
  enabled,
  onToggle,
  children,
}: ScheduleSectionCardProps) {
  return (
    <View style={scheduleFieldStyles.sectionCard}>
      <View style={scheduleFieldStyles.sectionHeader}>
        <View
          style={[scheduleFieldStyles.sectionIconWrap, { backgroundColor: section.bg }]}
        >
          <MaterialCommunityIcons name={section.icon} size={22} color={section.color} />
        </View>
        <View style={styles.titleBlock}>
          <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
            {sectionDisplayTitle(section)}
          </AppText>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#E0E0E0', true: section.color }}
          thumbColor={HomeTheme.white}
          ios_backgroundColor="#E0E0E0"
        />
      </View>
      {enabled && children ? (
        <View style={[scheduleFieldStyles.sectionBody, { backgroundColor: section.lightBg }]}>
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
