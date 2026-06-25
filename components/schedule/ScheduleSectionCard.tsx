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
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onAddPress?: () => void;
  canEdit?: boolean;
  children?: React.ReactNode;
}

export function ScheduleSectionCard({
  section,
  enabled,
  onToggle,
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
            { backgroundColor: enabled ? brandBg : '#F0F0F0' },
          ]}
        >
          <MaterialCommunityIcons
            name={section.icon}
            size={22}
            color={enabled ? brandColor : '#A0AEC0'}
          />
        </View>
        <View style={styles.titleBlock}>
          <AppText
            variant="bodySmall"
            weight="800"
            color={enabled ? HomeTheme.text : '#A0AEC0'}
          >
            {section.title}
          </AppText>
          {!enabled && (
            <AppText variant="caption" color="#A0AEC0" style={styles.disabledHint}>
              Disabled — toggle to enable
            </AppText>
          )}
        </View>
        {canEdit && onAddPress && enabled && (
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={onAddPress}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={24} color={brandColor} />
          </TouchableOpacity>
        )}
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
  headerAddBtn: {
    padding: 6,
    marginRight: 8,
  },
  disabledHint: {
    marginTop: 2,
    fontSize: 11,
  },
});

