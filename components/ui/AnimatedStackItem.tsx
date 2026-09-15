import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeIn,
  LinearTransition,
} from 'react-native-reanimated';

export type AnimationDirection = 'up' | 'down' | 'right' | 'left' | 'fade';

export interface AnimatedStackItemProps {
  /** Index in the list to calculate stagger delay */
  index?: number;
  /** Milliseconds delay per index step (default: 55ms) */
  staggerMs?: number;
  /** Base delay before animation starts (default: 0ms) */
  baseDelayMs?: number;
  /** Direction from which the item enters */
  direction?: AnimationDirection;
  /** Distance to travel in pixels (default: 24) */
  distance?: number;
  /** Spring damping (default: 18) */
  damping?: number;
  /** Spring stiffness (default: 140) */
  stiffness?: number;
  /** Mass of spring (default: 0.9) */
  mass?: number;
  /** Style applied to the animated wrapper view */
  style?: StyleProp<ViewStyle>;
  /** Children elements */
  children: React.ReactNode;
}

export const AnimatedStackItem: React.FC<AnimatedStackItemProps> = React.memo(
  ({
    index = 0,
    staggerMs = 55,
    baseDelayMs = 0,
    direction = 'up',
    distance = 24,
    damping = 18,
    stiffness = 140,
    mass = 0.9,
    style,
    children,
  }) => {
    const delay = Math.max(0, baseDelayMs + index * staggerMs);

    const enteringAnimation = React.useMemo(() => {
      let anim;
      switch (direction) {
        case 'up':
          // Moves from down to up
          anim = FadeInDown.springify()
            .damping(damping)
            .stiffness(stiffness)
            .mass(mass)
            .withInitialValues({ transform: [{ translateY: distance }], opacity: 0 });
          break;
        case 'down':
          // Moves from up to down
          anim = FadeInUp.springify()
            .damping(damping)
            .stiffness(stiffness)
            .mass(mass)
            .withInitialValues({ transform: [{ translateY: -distance }], opacity: 0 });
          break;
        case 'right':
          // Moves from right to left
          anim = FadeInRight.springify()
            .damping(damping)
            .stiffness(stiffness)
            .mass(mass)
            .withInitialValues({ transform: [{ translateX: distance }], opacity: 0 });
          break;
        case 'left':
          // Moves from left to right
          anim = FadeInRight.springify()
            .damping(damping)
            .stiffness(stiffness)
            .mass(mass)
            .withInitialValues({ transform: [{ translateX: -distance }], opacity: 0 });
          break;
        case 'fade':
        default:
          anim = FadeIn.duration(300);
          break;
      }

      return delay > 0 ? anim.delay(delay) : anim;
    }, [direction, distance, damping, stiffness, mass, delay]);

    return (
      <Animated.View
        entering={enteringAnimation}
        layout={LinearTransition.springify().damping(18).stiffness(140)}
        style={style}
      >
        {children}
      </Animated.View>
    );
  }
);

AnimatedStackItem.displayName = 'AnimatedStackItem';
