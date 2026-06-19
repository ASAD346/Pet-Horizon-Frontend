import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { FormSheetColors, formSheetStyles } from './formSheetStyles';

interface FormSectionProps {
  title: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor?: string;
  accentBg?: string;
  children: React.ReactNode;
}

export function FormSection({ title, icon, accentColor, accentBg, children }: FormSectionProps) {
  return (
    <View style={formSheetStyles.section}>
      <View style={formSheetStyles.sectionHeader}>
        {icon ? (
          <View
            style={[
              formSheetStyles.sectionIcon,
              { backgroundColor: accentBg ?? FormSheetColors.pageBg },
            ]}
          >
            <MaterialCommunityIcons name={icon} size={18} color={accentColor ?? FormSheetColors.label} />
          </View>
        ) : null}
        <AppText variant="bodySmall" weight="800" color={FormSheetColors.text}>
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}
