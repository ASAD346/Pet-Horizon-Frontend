import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';
import { useAppThemeColor } from './useAppThemeColor';

interface FormSectionProps {
  title: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor?: string;
  accentBg?: string;
  children: React.ReactNode;
}

export function FormSection({ title, icon, children }: FormSectionProps) {
  const { accentColor, accentBg } = useAppThemeColor();
  return (
    <View style={formSheetStyles.section}>
      <View style={formSheetStyles.sectionHeader}>
        {icon ? (
          <View
            style={[
              formSheetStyles.sectionIcon,
              { backgroundColor: accentBg },
            ]}
          >
            <MaterialCommunityIcons name={icon} size={22} color={accentColor} />
          </View>
        ) : null}
        <AppText variant="caption" weight="800" color={FormSheetColors.text} style={{ letterSpacing: 0.3 }}>
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}
