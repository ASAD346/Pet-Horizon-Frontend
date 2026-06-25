import React from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { AppButton } from './AppButton';

interface DangerButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function DangerButton(props: DangerButtonProps) {
  return <AppButton variant="danger" {...props} />;
}
