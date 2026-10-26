import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, Animated, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeModal } from '@/components/ui/SafeModal';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { selectUpgradeModal } from '@/redux/reducer';
import { hideUpgradePromptAction } from '@/redux/action';

const FEATURE_CONFIG = {
  pets: {
    title: 'Unlock Multi-Pet Profiles',
    message:
      'Free accounts can register 1 pet profile. Upgrade to PetHorizon Premium for unlimited pet profiles, instant profile switching, and complete care tracking for your entire pack.',
  },
  family: {
    title: 'Unlock Family Collaboration',
    message:
      'Invite family members, co-owners, and caregivers to help care for your pets. Upgrade to Premium for family invitations, task delegation, and shared logs.',
  },
  photos: {
    title: 'Upgrade for More Photos',
    message:
      'Free accounts include 1 photo per daily journal entry. Upgrade to PetHorizon Premium for up to 5 photos per day, high-res storage, and photo galleries.',
  },
  general: {
    title: 'Upgrade to PetHorizon Premium',
    message:
      'This feature requires a PetHorizon Premium subscription. Upgrade now to unlock unlimited pets, family sharing, and full access.',
  },
};

export function UpgradePromptHost() {
  const dispatch = useAppDispatch();
  const { visible, title: customTitle, message: customMessage, feature, onCancelRedirectBack } =
    useAppSelector(selectUpgradeModal);

  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 130,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const config = useMemo(() => {
    const key = (feature && feature in FEATURE_CONFIG) ? feature : 'general';
    return FEATURE_CONFIG[key as keyof typeof FEATURE_CONFIG];
  }, [feature]);

  const title = customTitle || config.title;
  const message = customMessage || config.message;

  const handleCancel = useCallback(() => {
    dispatch(hideUpgradePromptAction());
    if (onCancelRedirectBack) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [dispatch, onCancelRedirectBack]);

  const handleViewPlans = useCallback(() => {
    dispatch(hideUpgradePromptAction());
    router.navigate('/profile/premium' as Href);
  }, [dispatch]);

  if (!visible) return null;

  return (
    <SafeModal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable style={styles.innerPressable} onPress={(e) => e.stopPropagation()}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="crown" size={32} color="#D4A017" />
            </View>

            <AppText variant="h3" weight="800" color="#1A2B4E" style={styles.title}>
              {title}
            </AppText>

            <AppText variant="body" color={HomeTheme.textMuted} style={styles.message}>
              {message}
            </AppText>

            <View style={styles.buttonRow}>
              <AppButton
                title="Maybe Later"
                onPress={handleCancel}
                variant="outline"
                style={styles.flexButton}
              />
              <AppButton
                title="View Plans"
                onPress={handleViewPlans}
                style={[styles.flexButton, styles.upgradeBtn]}
                textStyle={styles.upgradeBtnText}
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </SafeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 348,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  innerPressable: {
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF9E6',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 160, 23, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  flexButton: {
    flex: 1,
  },
  upgradeBtn: {
    backgroundColor: '#184F2E',
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
