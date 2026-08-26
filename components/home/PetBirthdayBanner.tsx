import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, Modal, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { getBirthdayTurningAge } from '@/lib/pet/birthdayUtils';
import { Radius, Spacing, Palette } from '@/constants/theme';

interface PetBirthdayBannerProps {
  petName: string;
  birthday?: string | null;
  species?: string;
  isPremium?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ConfettiFlake({ index }: { index: number }) {
  const fallAnim = useRef(new Animated.Value(-50)).current;
  const slideAnim = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const colors = ['#FFD700', '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3'];
  const flakeColor = colors[index % colors.length];
  const size = Math.random() * 8 + 6;

  useEffect(() => {
    const duration = Math.random() * 3000 + 2000;
    const delay = Math.random() * 1500;

    const startAnimation = () => {
      fallAnim.setValue(-50);
      const baseSlide = Math.random() * SCREEN_WIDTH;
      slideAnim.setValue(baseSlide);
      rotateAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: SCREEN_HEIGHT + 50,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 360,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: baseSlide + (Math.random() * 120 - 60),
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: baseSlide - (Math.random() * 120 - 60),
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        startAnimation();
      });
    };

    const timer = setTimeout(() => {
      startAnimation();
    }, delay);

    return () => {
      clearTimeout(timer);
      fallAnim.stopAnimation();
      slideAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.flake,
        {
          width: size,
          height: size,
          backgroundColor: flakeColor,
          transform: [
            { translateY: fallAnim },
            { translateX: slideAnim },
            { rotate: spin },
          ],
        },
      ]}
    />
  );
}

function getSpeciesWish(petName: string, species?: string) {
  const cleanSpecies = (species || '').toLowerCase().trim();
  
  // Stable random selection based on the pet's name length to keep the wish consistent per render cycle
  const selectionIndex = petName.length % 3;

  if (cleanSpecies === 'dog' || cleanSpecies === 'puppy') {
    const wishes = [
      `Wishing your wonderful pup a day packed with giant bones, zoomies in the yard, and the best outdoor adventures! Hope your tail never stops wagging today! 🐕🎾`,
      `Happy Birthday to the goodest doggo! May your special day be filled with tasty meat treats, extra fetch time, and long fun runs in the park! 🐾🍖`,
      `Happy Birthday to your loyal furry friend! Sending you lots of warm hugs, peanut butter cups, and endless belly scratches! 🐶❤️`
    ];
    return wishes[selectionIndex];
  }
  if (cleanSpecies === 'cat' || cleanSpecies === 'kitten') {
    const wishes = [
      `Wishing your favorite feline friend a purr-fect birthday! May your day be filled with warm sunspots, premium catnip, and lots of playful string chasing! 🐈🧶`,
      `Happy Birthday to the king/queen of the house! Hope your day brings premium treats, cardboard boxes to climb, and endless chin scratches! 🐾🐟`,
      `Happy Birthday to the sweetest little furball! Wishing you cozy naps on fluffy pillows and fun mouse-toy hunt sessions today! 🐱💤`
    ];
    return wishes[selectionIndex];
  }
  if (cleanSpecies === 'rabbit' || cleanSpecies === 'bunny') {
    const wishes = [
      `Hop, hop, hooray! Happy Birthday to the sweetest little bun! Wishing you crunchy fresh carrots, cozy hay nests, and plenty of happy zoomy binkies today! 🐇🥕`,
      `Happy Birthday to your lovely bunny companion! May your day be filled with tasty greens, high leaps, and gentle nose rubs! 🐰🌿`,
      `Wishing the cutest hopper a wonderful birthday! Hoping your day is full of sweet berry snacks and delightful garden exploring! 🐇🌸`
    ];
    return wishes[selectionIndex];
  }
  if (cleanSpecies === 'bird' || cleanSpecies === 'parrot') {
    const wishes = [
      `Happy Birthday to the most chirpy companion! Wishing you a singing day full of tasty seeds, bright toys, and high-flying joy! 🦜🎵`,
      `Sending bright birthday melodies to your beautiful bird! May you whistle, chirp, and spread colorful happiness all day! 🐦✨`,
      `Happy Birthday to the sweetest songbird! Hope you enjoy yummy fruit treats and a cheerful day of flying and whistling! 🦜🍇`
    ];
    return wishes[selectionIndex];
  }
  if (cleanSpecies === 'hamster' || cleanSpecies === 'guinea pig' || cleanSpecies === 'rodent') {
    const wishes = [
      `Happy Birthday to the cutest little explorer! May your day be filled with wheel runs, delicious sunflower seeds, and cozy nest cuddles! 🐹🌻`,
      `Wishing a tiny happy birthday to your pocket companion! May you wheel-spin to your heart's content and enjoy fresh apple slices! 🐹🍎`,
      `Happy Birthday to the sweetest fluffy critter! Hope your cheeks are filled with yummy treats and your day is cozy! 🐾🥬`
    ];
    return wishes[selectionIndex];
  }
  
  // Default generic cute pet wishes
  const defaultWishes = [
    `Wishing your special companion a wonderful day filled with yummy treats, cozy naps, and endless belly rubs! 🐾🍰`,
    `Happy Birthday to your precious pet! May your day be packed with love, delicious snacks, and playful moments! 🎉❤️`,
    `Sending extra warm wishes to your sweet friend today! Hoping for a happy day filled with their favorite activities and treats! 🥳🎈`
  ];
  return defaultWishes[selectionIndex];
}

export function PetBirthdayBanner({ petName, birthday, species, isPremium = false }: PetBirthdayBannerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const turningAge = getBirthdayTurningAge(birthday);
  const ageLabel =
    turningAge === null
      ? 'today'
      : turningAge === 0
        ? 'their first birthday'
        : `turning ${turningAge} today`;

  const handlePress = () => {
    if (isPremium) {
      setModalVisible(true);
    }
  };

  const bannerContent = (
    <LinearGradient
      colors={['#FFFDF0', '#FFF9E6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="gift" size={20} color={Palette.premium.gold} />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="body" weight="800" color="#856404">
          Happy Birthday, {petName}! 🎉
        </AppText>
        <AppText variant="caption" weight="600" color="#9E802B">
          It&apos;s {ageLabel}. Give them extra love today.
        </AppText>
      </View>
    </LinearGradient>
  );

  return (
    <>
      {isPremium ? (
        <Pressable onPress={handlePress}>
          {bannerContent}
        </Pressable>
      ) : (
        bannerContent
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          {modalVisible && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {Array.from({ length: 45 }).map((_, i) => (
                <ConfettiFlake key={i} index={i} />
              ))}
            </View>
          )}

          <LinearGradient
            colors={['#FFFDF9', '#FFF5E0']}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <View style={styles.largeIconWrap}>
                <Ionicons name="gift" size={32} color={Palette.premium.gold} />
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <AppText variant="h1" weight="800" color="#856404" style={styles.modalTitle}>
                Happy Birthday, {petName}! 🥳
              </AppText>
              <AppText variant="body" weight="600" color="#9E802B" style={styles.modalSubtitle}>
                {getSpeciesWish(petName, species)}
              </AppText>
              <AppText variant="caption" weight="700" color="#B58900" style={styles.modalFootnote}>
                Celebrating {ageLabel} with extra love.
              </AppText>
            </View>

            <Pressable
              style={styles.celebrateBtn}
              onPress={() => setModalVisible(false)}
            >
              <AppText variant="bodySmall" weight="800" color="#FFFFFF">
                Let's Celebrate!
              </AppText>
            </Pressable>
          </LinearGradient>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flake: {
    position: 'absolute',
    borderRadius: 1,
  },
  modalCard: {
    width: SCREEN_WIDTH - 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.35)',
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.md,
  },
  largeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 160, 23, 0.25)',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  modalBody: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xs,
  },
  modalFootnote: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  celebrateBtn: {
    width: '100%',
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
});
