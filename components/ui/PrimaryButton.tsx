import React from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { AppButton } from './AppButton';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PrimaryButton({ variant = 'primary', ...props }: PrimaryButtonProps & { variant?: any }) {
  return <AppButton variant="primary" {...props} />;
}
