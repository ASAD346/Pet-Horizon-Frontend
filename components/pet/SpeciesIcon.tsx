import React from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export type SpeciesType =
  | 'dog'
  | 'cat'
  | 'bird'
  | 'rabbit'
  | 'hamster'
  | 'fish'
  | 'reptile'
  | 'other';

export interface SpeciesTheme {
  primary: string;
  secondary: string;
  bgLight: string;
  bgSelected: string;
  borderLight: string;
  borderSelected: string;
  badgeBg: string;
  textColor: string;
  selectedTextColor: string;
}

export const SPECIES_THEMES: Record<string, SpeciesTheme> = {
  dog: {
    primary: '#D97706',
    secondary: '#F59E0B',
    bgLight: '#FFFBEB',
    bgSelected: '#FEF3C7',
    borderLight: '#FDE68A',
    borderSelected: '#D97706',
    badgeBg: '#FEF3C7',
    textColor: '#78350F',
    selectedTextColor: '#92400E',
  },
  cat: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    bgLight: '#F5F3FF',
    bgSelected: '#EDE9FE',
    borderLight: '#DDD6FE',
    borderSelected: '#7C3AED',
    badgeBg: '#EDE9FE',
    textColor: '#4C1D95',
    selectedTextColor: '#5B21B6',
  },
  bird: {
    primary: '#0284C7',
    secondary: '#0EA5E9',
    bgLight: '#F0F9FF',
    bgSelected: '#E0F2FE',
    borderLight: '#BAE6FD',
    borderSelected: '#0284C7',
    badgeBg: '#E0F2FE',
    textColor: '#075985',
    selectedTextColor: '#0369A1',
  },
  rabbit: {
    primary: '#DB2777',
    secondary: '#EC4899',
    bgLight: '#FDF2F8',
    bgSelected: '#FCE7F3',
    borderLight: '#FBCFE8',
    borderSelected: '#DB2777',
    badgeBg: '#FCE7F3',
    textColor: '#9D174D',
    selectedTextColor: '#BE185D',
  },
  hamster: {
    primary: '#EA580C',
    secondary: '#F97316',
    bgLight: '#FFF7ED',
    bgSelected: '#FFEDD5',
    borderLight: '#FED7AA',
    borderSelected: '#EA580C',
    badgeBg: '#FFEDD5',
    textColor: '#9A3412',
    selectedTextColor: '#C2410C',
  },
  fish: {
    primary: '#0D9488',
    secondary: '#14B8A6',
    bgLight: '#F0FDFA',
    bgSelected: '#CCFBF1',
    borderLight: '#99F6E4',
    borderSelected: '#0D9488',
    badgeBg: '#CCFBF1',
    textColor: '#115E59',
    selectedTextColor: '#0F766E',
  },
  reptile: {
    primary: '#059669',
    secondary: '#10B981',
    bgLight: '#ECFDF5',
    bgSelected: '#D1FAE5',
    borderLight: '#A7F3D0',
    borderSelected: '#059669',
    badgeBg: '#D1FAE5',
    textColor: '#065F46',
    selectedTextColor: '#047857',
  },
  other: {
    primary: '#9333EA',
    secondary: '#A855F7',
    bgLight: '#FAF5FF',
    bgSelected: '#F3E8FF',
    borderLight: '#E9D5FF',
    borderSelected: '#9333EA',
    badgeBg: '#F3E8FF',
    textColor: '#581C87',
    selectedTextColor: '#6B21A8',
  },
};

export function getSpeciesTheme(speciesName?: string): SpeciesTheme {
  const key = (speciesName || '').trim().toLowerCase();
  return SPECIES_THEMES[key] || SPECIES_THEMES.other;
}

interface SpeciesIconProps {
  species: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
}

export const SpeciesIcon: React.FC<SpeciesIconProps> = ({
  species,
  size = 40,
  style,
  selected = false,
}) => {
  const key = (species || '').trim().toLowerCase();

  const renderVector = () => {
    switch (key) {
      case 'dog':
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <Defs>
              <LinearGradient id="dogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#F59E0B" />
                <Stop offset="100%" stopColor="#D97706" />
              </LinearGradient>
              <LinearGradient id="dogEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#B45309" />
                <Stop offset="100%" stopColor="#78350F" />
              </LinearGradient>
            </Defs>
            {/* Left Ear */}
            <Path
              d="M 13 14 C 7 16, 5 26, 9 32 C 11 35, 14 34, 15 27 Z"
              fill="url(#dogEarGrad)"
            />
            {/* Right Ear */}
            <Path
              d="M 35 14 C 41 16, 43 26, 39 32 C 37 35, 34 34, 33 27 Z"
              fill="url(#dogEarGrad)"
            />
            {/* Head */}
            <Circle cx="24" cy="24" r="15" fill="url(#dogGrad)" />
            {/* Fur spot on left eye */}
            <Path
              d="M 15 16 C 20 16, 21 23, 17 26 C 13 28, 12 21, 15 16 Z"
              fill="#D97706"
              opacity={0.5}
            />
            {/* Snout Muzzle */}
            <Ellipse cx="24" cy="28" rx="8.5" ry="6.5" fill="#FEF3C7" />
            {/* Nose */}
            <Path
              d="M 21.5 25.5 C 21.5 24.5, 26.5 24.5, 26.5 25.5 C 26.5 27.5, 24 28.5, 24 28.5 C 24 28.5, 21.5 27.5, 21.5 25.5 Z"
              fill="#292524"
            />
            {/* Mouth / Smile */}
            <Path
              d="M 21.5 29 C 22.5 30.5, 25.5 30.5, 26.5 29"
              stroke="#78350F"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tongue */}
            <Path
              d="M 22.5 29.8 C 22.5 32.5, 25.5 32.5, 25.5 29.8 Z"
              fill="#F43F5E"
            />
            {/* Eyes */}
            <Circle cx="18" cy="20" r="2.2" fill="#1C1917" />
            <Circle cx="18.8" cy="19.2" r="0.8" fill="#FFFFFF" />
            <Circle cx="30" cy="20" r="2.2" fill="#1C1917" />
            <Circle cx="30.8" cy="19.2" r="0.8" fill="#FFFFFF" />
            {/* Eyebrow dots */}
            <Circle cx="18" cy="15.5" r="1.3" fill="#FDE68A" />
            <Circle cx="30" cy="15.5" r="1.3" fill="#FDE68A" />
          </Svg>
        );

      case 'cat':
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <Defs>
              <LinearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#A78BFA" />
                <Stop offset="100%" stopColor="#7C3AED" />
              </LinearGradient>
            </Defs>
            {/* Left Ear */}
            <Path d="M 10 21 L 14 7 C 16 5, 20 9, 21 14 Z" fill="#7C3AED" />
            <Path d="M 12.5 19 L 15 9.5 C 16.5 8.5, 18.5 11, 19.5 14.5 Z" fill="#F472B6" />
            {/* Right Ear */}
            <Path d="M 38 21 L 34 7 C 32 5, 28 9, 27 14 Z" fill="#7C3AED" />
            <Path d="M 35.5 19 L 33 9.5 C 31.5 8.5, 29.5 11, 28.5 14.5 Z" fill="#F472B6" />
            {/* Head */}
            <Ellipse cx="24" cy="26" rx="15" ry="13.5" fill="url(#catGrad)" />
            {/* Cheeks / Muzzle */}
            <Ellipse cx="24" cy="29.5" rx="7.5" ry="5.5" fill="#EDE9FE" />
            {/* Whiskers */}
            <Path
              d="M 8 27 L 15 28.5 M 8 31 L 15 30.5 M 40 27 L 33 28.5 M 40 31 L 33 30.5"
              stroke="#DDD6FE"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Eyes */}
            <Ellipse cx="17.5" cy="23.5" rx="2.8" ry="3.2" fill="#1E1B4B" />
            <Circle cx="16.7" cy="22.2" r="1" fill="#FFFFFF" />
            <Ellipse cx="30.5" cy="23.5" rx="2.8" ry="3.2" fill="#1E1B4B" />
            <Circle cx="29.7" cy="22.2" r="1" fill="#FFFFFF" />
            {/* Nose */}
            <Path d="M 22.5 28 L 25.5 28 L 24 30 Z" fill="#EC4899" />
            {/* Mouth */}
            <Path
              d="M 21.5 30.5 Q 24 32.5 24 30.5 Q 24 32.5 26.5 30.5"
              stroke="#6D28D9"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        );

      case 'bird':
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <Defs>
              <LinearGradient id="birdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#38BDF8" />
                <Stop offset="100%" stopColor="#0284C7" />
              </LinearGradient>
              <LinearGradient id="beakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FBBF24" />
                <Stop offset="100%" stopColor="#D97706" />
              </LinearGradient>
            </Defs>
            {/* Crest feathers on top */}
            <Path
              d="M 22 8 C 22 4, 25 3, 26 7 C 28 4, 31 5, 29 11 Z"
              fill="#0369A1"
            />
            {/* Tail feathers */}
            <Path d="M 12 30 L 4 33 L 11 36 Z" fill="#0284C7" />
            {/* Body */}
            <Ellipse cx="24" cy="25" rx="14" ry="14" fill="url(#birdGrad)" />
            {/* Belly Patch */}
            <Path
              d="M 17 25 C 17 33, 31 33, 31 25 C 31 20, 17 20, 17 25 Z"
              fill="#BAE6FD"
            />
            {/* Wing */}
            <Path
              d="M 12 24 C 10 29, 13 35, 18 35 C 18 30, 16 26, 12 24 Z"
              fill="#0369A1"
            />
            {/* Beak */}
            <Path d="M 33 21 L 42 24.5 L 33 28 Z" fill="url(#beakGrad)" />
            {/* Eye */}
            <Circle cx="29" cy="20" r="3" fill="#0F172A" />
            <Circle cx="30" cy="19" r="1" fill="#FFFFFF" />
            {/* Cheek blush */}
            <Circle cx="26" cy="26" r="2.8" fill="#FDA4AF" opacity={0.6} />
          </Svg>
        );

      case 'rabbit':
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <Defs>
              <LinearGradient id="rabbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#F472B6" />
                <Stop offset="100%" stopColor="#DB2777" />
              </LinearGradient>
            </Defs>
            {/* Left Ear */}
            <Path
              d="M 15 22 C 12 16, 12 4, 17 4 C 21 4, 20 16, 19 22 Z"
              fill="url(#rabbitGrad)"
            />
            <Path
              d="M 16 19 C 14.5 15, 14.5 7, 17 7 C 19 7, 18.5 15, 18 19 Z"
              fill="#FDF2F8"
            />
            {/* Right Ear */}
            <Path
              d="M 29 22 C 28 16, 27 4, 31 4 C 36 4, 36 16, 33 22 Z"
              fill="url(#rabbitGrad)"
            />
            <Path
              d="M 30 19 C 29.5 15, 29 7, 31 7 C 33.5 7, 33.5 15, 32 19 Z"
              fill="#FDF2F8"
            />
            {/* Head */}
            <Ellipse cx="24" cy="29" rx="14" ry="12" fill="#FBCFE8" />
            {/* Cheeks / Muzzle */}
            <Ellipse cx="24" cy="33" rx="8" ry="5.5" fill="#FFFFFF" />
            {/* Eyes */}
            <Circle cx="17.5" cy="27.5" r="2.5" fill="#4A044E" />
            <Circle cx="18.3" cy="26.7" r="0.9" fill="#FFFFFF" />
            <Circle cx="30.5" cy="27.5" r="2.5" fill="#4A044E" />
            <Circle cx="31.3" cy="26.7" r="0.9" fill="#FFFFFF" />
            {/* Pink Nose */}
            <Path d="M 22.5 31.5 L 25.5 31.5 L 24 33 Z" fill="#DB2777" />
            {/* Buck Teeth */}
            <Path
              d="M 22.8 34.5 H 25.2 V 36.5 H 22.8 Z"
              fill="#FFFFFF"
              stroke="#DB2777"
              strokeWidth="0.8"
            />
            {/* Rosy Cheeks */}
            <Circle cx="14" cy="31" r="2.5" fill="#F43F5E" opacity={0.35} />
            <Circle cx="34" cy="31" r="2.5" fill="#F43F5E" opacity={0.35} />
            {/* Whiskers */}
            <Path
              d="M 10 31 L 16 32 M 10 34 L 16 34 M 38 31 L 32 32 M 38 34 L 32 34"
              stroke="#BE185D"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </Svg>
        );

      case 'hamster':
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <Defs>
              <LinearGradient id="hamsterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FB923C" />
                <Stop offset="100%" stopColor="#EA580C" />
              </LinearGradient>
            </Defs>
            {/* Round Left Ear */}
            <Circle cx="13" cy="15" r="5" fill="#FB923C" />
            <Circle cx="13" cy="15" r="3" fill="#FED7AA" />
            {/* Round Right Ear */}
            <Circle cx="35" cy="15" r="5" fill="#FB923C" />
            <Circle cx="35" cy="15" r="3" fill="#FED7AA" />
            {/* Chubby Head/Body */}
            <Ellipse cx="24" cy="27" rx="15.5" ry="13.5" fill="url(#hamsterGrad)" />
            {/* Chubby Cheeks & Belly */}
            <Path
              d="M 13 27 C 11 36, 37 36, 35 27 C 34 22, 14 22, 13 27 Z"
              fill="#FFEDD5"
            />
            {/* Eyes */}
            <Circle cx="18" cy="22" r="2.5" fill="#1C1917" />
            <Circle cx="18.8" cy="21.2" r="0.9" fill="#FFFFFF" />
            <Circle cx="30" cy="22" r="2.5" fill="#1C1917" />
            <Circle cx="30.8" cy="21.2" r="0.9" fill="#FFFFFF" />
            {/* Nose & Smile */}
            <Circle cx="24" cy="26" r="1.5" fill="#EA580C" />
            <Path
              d="M 22 27.5 Q 24 29.5 26 27.5"
              stroke="#9A3412"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Sunflower seed in center */}
            <Path
              d="M 24 29.5 C 22 31.5, 22 34.5, 24 36.5 C 26 34.5, 26 31.5, 24 29.5 Z"
              fill="#D97706"
            />
            {/* Little Paws holding seed */}
            <Ellipse cx="20.5" cy="34" rx="2.5" ry="3" fill="#FED7AA" />
            <Ellipse cx="27.5" cy="34" rx="2.5" ry="3" fill="#FED7AA" />
          </Svg>
        );

      case 'fish':
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <Defs>
              <LinearGradient id="fishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#14B8A6" />
                <Stop offset="100%" stopColor="#0D9488" />
              </LinearGradient>
            </Defs>
            {/* Tail Fin */}
            <Path
              d="M 14 24 C 8 16, 5 13, 4 19 C 7 24, 7 24, 4 29 C 5 35, 8 32, 14 24 Z"
              fill="#0F766E"
            />
            {/* Dorsal Fin (Top) */}
            <Path
              d="M 21 14 C 25 10, 31 12, 33 16 C 28 15, 24 15, 21 14 Z"
              fill="#2DD4BF"
            />
            {/* Ventral Fin (Bottom) */}
            <Path
              d="M 23 34 C 26 38, 30 37, 32 33 C 28 33, 25 33, 23 34 Z"
              fill="#2DD4BF"
            />
            {/* Fish Body */}
            <Path
              d="M 12 24 C 15 15, 36 15, 42 24 C 36 33, 15 33, 12 24 Z"
              fill="url(#fishGrad)"
            />
            {/* Stripe pattern */}
            <Path
              d="M 23 16.5 C 25 21, 25 27, 23 31.5 C 26 31, 28 27, 28 24 C 28 21, 26 17, 23 16.5 Z"
              fill="#CCFBF1"
            />
            {/* Shiny Eye */}
            <Circle cx="35.5" cy="22" r="3.2" fill="#042F2E" />
            <Circle cx="36.5" cy="21" r="1" fill="#FFFFFF" />
            {/* Bubbles */}
            <Circle cx="43" cy="14" r="2" fill="#99F6E4" opacity={0.8} />
            <Circle cx="45" cy="9" r="1.3" fill="#99F6E4" opacity={0.8} />
          </Svg>
        );

      case 'reptile':
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <Defs>
              <LinearGradient id="reptileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#34D399" />
                <Stop offset="100%" stopColor="#059669" />
              </LinearGradient>
            </Defs>
            {/* Curled Gecko Tail */}
            <Path
              d="M 13 32 C 8 35, 5 30, 8 26 C 10 23, 14 26, 12 29"
              stroke="#047857"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Reptile Body & Head */}
            <Path
              d="M 14 29 C 13 21, 20 17, 28 17 C 37 17, 41 21, 41 27 C 41 32, 33 35, 23 35 C 18 35, 15 33, 14 29 Z"
              fill="url(#reptileGrad)"
            />
            {/* Spiky Crest */}
            <Path
              d="M 19 17 L 21 13 L 23 17 L 25 13 L 27 17"
              stroke="#047857"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
            {/* Light Underbelly */}
            <Path
              d="M 17 30 C 21 33, 31 33, 35 29 C 33 34, 19 34, 17 30 Z"
              fill="#A7F3D0"
            />
            {/* Big Expressive Eye */}
            <Circle cx="33.5" cy="23" r="4.8" fill="#10B981" />
            <Circle cx="34" cy="23" r="2.8" fill="#064E3B" />
            <Circle cx="35" cy="22" r="0.9" fill="#FFFFFF" />
            {/* Spots */}
            <Circle cx="21" cy="23" r="1.4" fill="#047857" opacity={0.6} />
            <Circle cx="26" cy="24" r="1.6" fill="#047857" opacity={0.6} />
          </Svg>
        );

      case 'other':
      default:
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <Defs>
              <LinearGradient id="otherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#C084FC" />
                <Stop offset="100%" stopColor="#9333EA" />
              </LinearGradient>
            </Defs>
            {/* Main Paw Pad */}
            <Path
              d="M 24 35 C 17 35, 15 28, 18.5 23 C 21 19.5, 27 19.5, 29.5 23 C 33 28, 31 35, 24 35 Z"
              fill="url(#otherGrad)"
            />
            <Path
              d="M 24 32 C 19.5 32, 18 27.5, 20.5 23.5 C 22 21, 26 21, 27.5 23.5 C 30 27.5, 28.5 32, 24 32 Z"
              fill="#E9D5FF"
              opacity={0.4}
            />
            {/* Toe Beans */}
            <Ellipse
              cx="13"
              cy="19"
              rx="3.5"
              ry="4.8"
              transform="rotate(-20 13 19)"
              fill="#A855F7"
            />
            <Ellipse
              cx="19.5"
              cy="12"
              rx="3.5"
              ry="5"
              transform="rotate(-8 19.5 12)"
              fill="#A855F7"
            />
            <Ellipse
              cx="28.5"
              cy="12"
              rx="3.5"
              ry="5"
              transform="rotate(8 28.5 12)"
              fill="#A855F7"
            />
            <Ellipse
              cx="35"
              cy="19"
              rx="3.5"
              ry="4.8"
              transform="rotate(20 35 19)"
              fill="#A855F7"
            />
            {/* Sparkle Star */}
            <Path
              d="M 40 7 L 41 10 L 44 11 L 41 12 L 40 15 L 39 12 L 36 11 L 39 10 Z"
              fill="#F59E0B"
            />
            <Path
              d="M 8 9 L 9 11 L 11 12 L 9 13 L 8 15 L 7 13 L 5 12 L 7 11 Z"
              fill="#F59E0B"
            />
          </Svg>
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderVector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
