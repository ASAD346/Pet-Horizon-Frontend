import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  LinearTransition,
  withDelay,
  withSpring,
  EntryAnimationsValues,
} from 'react-native-reanimated';

export type AnimationDirection = 'up' | 'down' | 'right' | 'left' | 'fade';

export interface AnimatedStackItemProps {
  /** Index in the list to calculate stagger delay */
  index?: number;
  /** Milliseconds delay per index step (default: 45ms) */
  staggerMs?: number;
  /** Base delay before animation starts (default: 0ms) */
  baseDelayMs?: number;
  /** Direction from which the item enters */
  direction?: AnimationDirection;
  /** Distance to travel in pixels (default: 24) */
  distance?: number;
  /** Spring damping (default: 15) */
  damping?: number;
  /** Spring stiffness (default: 140) */
  stiffness?: number;
  /** Mass of spring (default: 0.8) */
  mass?: number;
  /** Style applied to the animated wrapper view */
  style?: StyleProp<ViewStyle>;
  /** Children elements */
  children: React.ReactNode;
}

export const AnimatedStackItem: React.FC<AnimatedStackItemProps> = React.memo(
  ({
    index = 0,
    staggerMs = 45,
    baseDelayMs = 0,
    direction = 'up',
    distance = 24,
    damping = 15,
    stiffness = 140,
    mass = 0.8,
    style,
    children,
  }) => {
    const delay = Math.max(0, baseDelayMs + index * staggerMs);

    const enteringAnimation = React.useCallback(
      (_targetValues: EntryAnimationsValues) => {
        'worklet';
        const initialTranslateY =
          direction === 'up' ? distance : direction === 'down' ? -distance : 0;
        const initialTranslateX =
          direction === 'right' ? distance : direction === 'left' ? -distance : 0;

        return {
          initialValues: {
            opacity: 1,
            transform: [
              { translateY: initialTranslateY },
              { translateX: initialTranslateX },
              { scale: 0.94 },
            ],
          },
          animations: {
            transform: [
              {
                translateY: withDelay(
                  delay,
                  withSpring(0, { damping, stiffness, mass })
                ),
              },
              {
                translateX: withDelay(
                  delay,
                  withSpring(0, { damping, stiffness, mass })
                ),
              },
              {
                scale: withDelay(
                  delay,
                  withSpring(1, { damping, stiffness, mass })
                ),
              },
            ],
          },
        };
      },
      [delay, direction, distance, damping, stiffness, mass]
    );

    return (
      <Animated.View
        entering={enteringAnimation}
        layout={LinearTransition.springify().damping(18).stiffness(140)}
        style={[{ backgroundColor: 'transparent' }, style]}
      >
        {children}
      </Animated.View>
    );
  }
);

AnimatedStackItem.displayName = 'AnimatedStackItem';
