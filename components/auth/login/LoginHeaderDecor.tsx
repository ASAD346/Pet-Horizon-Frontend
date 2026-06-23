import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export function LoginHeaderDecor() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Soft Green Glow Circle */}
      <View style={[styles.glowCircle, styles.glowGreen]} />
      {/* Soft Orange Glow Circle */}
      <View style={[styles.glowCircle, styles.glowOrange]} />
      {/* Soft Navy Blur Ring */}
      <View style={styles.blurRing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 999,
    width: width * 0.8,
    height: width * 0.8,
    opacity: 0.12,
  },
  glowGreen: {
    backgroundColor: '#5CB35D',
    top: -width * 0.35,
    right: -width * 0.25,
  },
  glowOrange: {
    backgroundColor: '#F48024',
    bottom: -width * 0.4,
    left: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
  },
  blurRing: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 43, 78, 0.04)',
    top: width * 0.1,
    left: -width * 0.2,
  },
});
