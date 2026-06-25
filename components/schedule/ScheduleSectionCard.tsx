import React from 'react';
import { View, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Palette } from '@/constants/theme';
import { scheduleFieldStyles } from './scheduleStyles';
import { type ScheduleSectionTheme } from './scheduleTheme';
import { useAuth } from '@/hooks/useAuth';

interface ScheduleSectionCardProps {
  section: ScheduleSectionTheme;
  onAddPress?: () => void;
  canEdit?: boolean;
  children?: React.ReactNode;
}

export function ScheduleSectionCard({
  section,
  onAddPress,
  canEdit = true,
  children,
}: ScheduleSectionCardProps) {
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';
  const brandColor = isPremium ? Palette.premium.emerald : Palette.success;
  const brandBg = isPremium ? Palette.premium.emeraldLight : Palette.successLight;

  return (
    <View style={scheduleFieldStyles.sectionCard}>
      <View style={scheduleFieldStyles.sectionHeader}>
        <View
          style={[
            scheduleFieldStyles.sectionIconWrap,
            { backgroundColor: brandBg },
          ]}
        >
          <MaterialCommunityIcons
            name={section.icon}
            size={22}
            color={brandColor}
          />
        </View>
        <View style={styles.titleBlock}>
          <AppText
            variant="bodySmall"
            weight="800"
            color={HomeTheme.text}
          >
            {section.title}
          </AppText>
        </View>
      </View>
      {children ? (
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
  headerAddBtn: {
    padding: 6,
    marginRight: 8,
  },
  disabledHint: {
    marginTop: 2,
    fontSize: 11,
  },
});

