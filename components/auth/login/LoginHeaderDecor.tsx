import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoginTheme } from '../../../constants/theme';

/** Both corner blobs use the same circle radius (matching mockup). */
const ARC_RADIUS = 100;
const ARC_DIAMETER = ARC_RADIUS * 2;

type CornerBlobProps = {
  color: string;
  clipWidth: number;
  clipHeight: number;
  /** Circle anchor — negative top/right places the circle center outside the clip. */
  circleTop: number;
  circleRight: number;
  zIndex: number;
};

function CornerBlob({
  color,
  clipWidth,
  clipHeight,
  circleTop,
  circleRight,
  zIndex,
}: CornerBlobProps) {
  return (
    <View style={[styles.clip, { width: clipWidth, height: clipHeight, zIndex }]}>
      <View
        style={[
          styles.circle,
          {
            width: ARC_DIAMETER,
            height: ARC_DIAMETER,
            borderRadius: ARC_RADIUS,
            top: circleTop,
            right: circleRight,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

/**
 * Top-right corner decor: charcoal + green arcs from two equal circles,
 * clipped so they overlap like the Pet Horizon login mockup.
 */
export function LoginHeaderDecor() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Charcoal — wider clip, curves under status icons (signal / Wi‑Fi) */}
      <CornerBlob
        color={LoginTheme.charcoal}
        clipWidth={ARC_RADIUS + 36}
        clipHeight={ARC_RADIUS + 24}
        circleTop={-ARC_RADIUS}
        circleRight={-ARC_RADIUS + 22}
        zIndex={1}
      />
      {/* Green — same circle size, shifted right; runs down the screen edge */}
      <CornerBlob
        color={LoginTheme.green}
        clipWidth={56}
        clipHeight={ARC_RADIUS + 88}
        circleTop={-ARC_RADIUS + 10}
        circleRight={-ARC_RADIUS - 6}
        zIndex={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 0,
  },
  clip: {
    position: 'absolute',
    top: 0,
    right: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
  },
});
