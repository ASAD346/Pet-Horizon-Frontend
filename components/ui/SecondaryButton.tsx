import React from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { AppButton } from './AppButton';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function SecondaryButton(props: SecondaryButtonProps) {
  return <AppButton variant="secondary" {...props} />;
}
