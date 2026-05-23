import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoginTheme } from '../../constants/theme';

interface PetPhotoPickerProps {
  onPress?: () => void;
}

export function PetPhotoPicker({ onPress }: PetPhotoPickerProps) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.circle} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name="camera" size={28} color={LoginTheme.green} />
        <View style={styles.addBadge}>
          <Ionicons name="add" size={16} color={LoginTheme.footerText} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: LoginTheme.green,
    backgroundColor: '#F0F7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: LoginTheme.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: LoginTheme.screenBg,
  },
});
