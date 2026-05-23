import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Radius } from '../../constants/theme';

type IonIcon = React.ComponentProps<typeof Ionicons>['name'];
type MciIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ColorIconBadgeProps {
  color: string;
  backgroundColor?: string;
  size?: number;
  iconSize?: number;
  shape?: 'circle' | 'rounded';
  iconSet?: 'ionicons' | 'material';
  ionIcon?: IonIcon;
  materialIcon?: MciIcon;
  style?: ViewStyle;
  /** When true, shows white checkmark (for completed schedule items). */
  completed?: boolean;
}

export function ColorIconBadge({
  color,
  backgroundColor,
  size = 44,
  iconSize = 22,
  shape = 'rounded',
  iconSet = 'material',
  ionIcon,
  materialIcon,
  style,
  completed = false,
}: ColorIconBadgeProps) {
  const radius = shape === 'circle' ? size / 2 : Radius.md;
  const bg = backgroundColor ?? `${color}22`;

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: completed ? color : bg,
        },
        style,
      ]}
    >
      {completed ? (
        <Ionicons name="checkmark" size={iconSize} color="#FFFFFF" />
      ) : iconSet === 'ionicons' && ionIcon ? (
        <Ionicons name={ionIcon} size={iconSize} color={color} />
      ) : materialIcon ? (
        <MaterialCommunityIcons name={materialIcon} size={iconSize} color={color} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
