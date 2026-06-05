import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { scheduleFieldStyles } from './scheduleStyles';

interface ScheduleDashedAddButtonProps {
  label: string;
  color: string;
  onPress: () => void;
}

export function ScheduleDashedAddButton({ label, color, onPress }: ScheduleDashedAddButtonProps) {
  return (
    <TouchableOpacity
      style={[scheduleFieldStyles.dashedAddBtn, { borderColor: `${color}55` }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name="add" size={18} color={color} />
      <AppText variant="bodySmall" weight="700" color={color}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}
