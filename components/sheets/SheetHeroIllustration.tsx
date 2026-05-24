import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing } from '../../constants/theme';

interface SheetHeroIllustrationProps {
  borderColor: string;
  backgroundColor?: string;
  heartColor?: string;
}

export function SheetHeroIllustration({
  borderColor,
  backgroundColor = '#F5F9F4',
  heartColor = '#E57373',
}: SheetHeroIllustrationProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, { borderColor, backgroundColor }]}>
        <Image
          source={require('../../assets/images/onboarding.png')}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.pawBadge}>
          <MaterialCommunityIcons name="paw" size={16} color={heartColor} />
        </View>
        <MaterialCommunityIcons name="heart" size={12} color={heartColor} style={styles.heartLeft} />
        <MaterialCommunityIcons name="heart" size={10} color={heartColor} style={styles.heartRight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  frame: {
    width: '100%',
    maxWidth: 280,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pawBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  heartLeft: {
    position: 'absolute',
    left: 24,
    top: 36,
  },
  heartRight: {
    position: 'absolute',
    right: 28,
    top: 42,
  },
});
