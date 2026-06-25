import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { getErrorMessage } from '@/lib/api/errors';
import {
  createPaymentIntent,
  fetchPremiumPlans,
  fetchPremiumStatus,
  subscribePremium,
} from '@/services/premium/premiumApi';
import { fetchUserProfile } from '@/services/users/userApi';
import type { PremiumPlan } from '@/types/premium';
import { SecureCheckoutSheet } from './SecureCheckoutSheet';
import { TermsAndConditionsSheet } from './TermsAndConditionsSheet';
import {
  formatPlanPrice,
  planPeriodLabel,
} from './profileTheme';
import { SkeletonPremiumPlans } from '@/components/ui/skeletons';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';

const HERO_ILLUSTRATION = require('../../assets/images/onboarding_health.png');

const BENEFITS = [
  { icon: 'paw' as const, label: 'Unlimited Pets', desc: 'Add and manage all your family pets without any limitations' },
  { icon: 'notifications' as const, label: 'Smart Reminders', desc: 'Advanced alerts and schedule sync for tasks, meals, and meds' },
  { icon: 'bar-chart' as const, label: 'Advanced Health Analytics', desc: 'Deep-dive charts and trends for weight, activity, and growth' },
  { icon: 'people' as const, label: 'Family Collaboration', desc: 'Invite family members or co-owners to co-manage your pet tasks' },
  { icon: 'wallet' as const, label: 'Expense Insights', desc: 'Detailed budgeting, category insights, and expense trends' },
  { icon: 'ribbon' as const, label: 'Growth Tracking', desc: 'Log and monitor developmental milestones and measurements' },
  { icon: 'shield-checkmark' as const, label: 'Vaccination Management', desc: 'Organize vaccination schedules, certificates, and alerts' },
];

const SUCCESS_BENEFITS = [
  {
    icon: 'paw' as const,
    title: 'Unlimited Pet Profiles',
    desc: 'Manage all your pets in one app without any restrictions.',
  },
  {
    icon: 'notifications' as const,
    title: 'Smart Reminders',
    desc: 'Never miss feeding, medication, walks, or vaccinations.',
  },
  {
    icon: 'analytics' as const,
    title: 'Premium Insights',
    desc: 'Advanced health, weight, activity, and expense tracking.',
  },
];

const TRUST_ITEMS = [
  { icon: 'shield-checkmark' as const, title: 'Secure Checkout', desc: '256-bit encryption' },
  { icon: 'refresh' as const, title: 'Cancel Anytime', desc: 'Easy store management' },
  { icon: 'wallet' as const, title: 'No Hidden Fees', desc: 'Upfront pricing' },
  { icon: 'people' as const, title: 'Family Sharing', desc: 'Included in Yearly' },
];

const ALLOWED_PLAN_IDS = new Set(['monthly', 'yearly']);

export function PremiumHubContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { token, user, setSession } = useAuth();
  const { pet } = useActivePet(token);
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  // Success Modal Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const crownRotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim1 = useRef(new Animated.Value(0)).current;
  const sparkleAnim2 = useRef(new Animated.Value(0)).current;

  const loadPlans = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [planList, status] = await Promise.all([
        fetchPremiumPlans(token),
        fetchPremiumStatus(token),
      ]);
      const filtered = planList.filter((p) => ALLOWED_PLAN_IDS.has(p.planId));
      setPlans(filtered);
      setIsPremium(status.isPremium);
      if (filtered.length > 0) {
        const yearly = filtered.find((p) => p.planId === 'yearly');
        setSelectedPlanId(yearly?.planId ?? filtered[0].planId);
      }
    } catch (error) {
      Alert.alert('Premium', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Trigger Modal animations when visible
  useEffect(() => {
    if (successVisible) {
      // Reset values
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
      crownRotateAnim.setValue(0);
      sparkleAnim1.setValue(0);
      sparkleAnim2.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(crownRotateAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.parallel([
            Animated.spring(sparkleAnim1, {
              toValue: 1,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.spring(sparkleAnim2, {
              toValue: 1,
              friction: 5,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [successVisible]);

  const selectedPlan = plans.find((p) => p.planId === selectedPlanId) ?? null;
  const monthlyPlan = plans.find((p) => p.planId === 'monthly');
  const yearlyPlan = plans.find((p) => p.planId === 'yearly');

  const handleStartTrial = () => {
    if (isPremium) {
      Alert.alert('Premium', 'You already have an active premium subscription.');
      return;
    }
    setCheckoutError(null);
    setCheckoutVisible(true);
  };

  const handleConfirmPayment = async () => {
    if (!token || !selectedPlan || !user?._id) return;

    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      await createPaymentIntent(token, selectedPlan.planId, 'pm_stub_ui');
      await subscribePremium(token, { planId: selectedPlan.planId });
      const profile = await fetchUserProfile(token, user._id);
      await setSession({ token, user: { ...profile, premiumStatus: 'premium' } });
      setIsPremium(true);
      setCheckoutVisible(false);
      setSuccessVisible(true);
    } catch (error) {
      setCheckoutError(getErrorMessage(error));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const scrollToBenefits = () => {
    setSuccessVisible(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderPlanCard = (plan: PremiumPlan | undefined, popular?: boolean) => {
    if (!plan) return null;
    const selected = selectedPlanId === plan.planId;

    return (
      <TouchableOpacity
        key={plan.planId}
        style={[
          styles.planCard,
          selected ? styles.planCardSelected : styles.planCardUnselected,
          popular && selected && styles.planCardRecommendedSelected,
        ]}
        onPress={() => setSelectedPlanId(plan.planId)}
        activeOpacity={0.9}
      >
        {popular && (
          <View style={styles.popularBadge}>
            <AppText variant="caption" weight="800" color="#FFFFFF" style={styles.popularText}>
              RECOMMENDED • SAVE 20%
            </AppText>
          </View>
        )}
        <View style={styles.planHeaderRow}>
          <AppText
            variant="body"
            weight="800"
            color={selected ? '#0F3E26' : '#475569'}
            style={styles.planName}
          >
            {plan.name}
          </AppText>
          <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
            {selected && <View style={styles.radioDot} />}
          </View>
        </View>
        <View style={styles.priceContainer}>
          <AppText
            variant="h2"
            weight="800"
            color={selected ? '#0F3E26' : '#1E293B'}
            style={styles.planPrice}
          >
            {formatPlanPrice(plan.price)}
          </AppText>
          <AppText
            variant="caption"
            color={selected ? '#1E5838' : '#64748B'}
            style={styles.planPeriod}
          >
            {planPeriodLabel(plan.planId, plan.periodDays)}
          </AppText>
        </View>
      </TouchableOpacity>
    );
  };

  const crownRotation = crownRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const crownScale = crownRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.15],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Gradient Hero Section */}
        <LinearGradient
          colors={['#06190E', '#0A2D1B', '#114427']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroWrapper}
        >
          <View style={styles.heroWatermarkContainer}>
            <Image source={HERO_ILLUSTRATION} style={styles.heroWatermark} contentFit="contain" />
          </View>

          <TouchableOpacity
            style={[styles.backBtn, { top: Math.max(insets.top, Spacing.sm) }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.crownContainer}>
              <Ionicons name="sparkles" size={12} color="#D4A017" />
              <AppText variant="caption" weight="800" color="#D4A017" style={styles.crownText}>
                PET HORIZON PREMIUM
              </AppText>
            </View>
            <AppText variant="h1" weight="800" color="#FFFFFF" style={styles.heroTitle}>
              Elevate Your Pet's Care
            </AppText>
            <AppText variant="bodySmall" color="#CBD5E1" style={styles.heroSubtitle}>
              Unlock complete health analytics, unlimited tracking profiles, smart schedule reminders, and collaborative care.
            </AppText>
          </View>
        </LinearGradient>

        <View style={styles.contentBlock}>
          {/* Unified Benefits Card */}
          <AppCard style={styles.benefitsCard}>
            <View style={styles.sectionHeader}>
              <AppText variant="caption" weight="800" color="#D4A017" style={styles.sectionTag}>
                INCLUDED BENEFITS
              </AppText>
              <AppText variant="body" weight="800" color="#0F3E26" style={styles.sectionTitle}>
                Everything Your Pet Deserves
              </AppText>
            </View>
            <View style={styles.benefitsList}>
              {BENEFITS.map((feature, idx) => (
                <View
                  key={feature.label}
                  style={[
                    styles.benefitRow,
                    idx < BENEFITS.length - 1 && styles.benefitRowBorder,
                  ]}
                >
                  <View style={styles.benefitIconContainer}>
                    <Ionicons name={feature.icon} size={16} color="#D4A017" />
                  </View>
                  <View style={styles.benefitTextContainer}>
                    <AppText variant="bodySmall" weight="800" color="#0F3E26">
                      {feature.label}
                    </AppText>
                    <AppText variant="caption" color="#64748B" style={styles.benefitDesc}>
                      {feature.desc}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </AppCard>

          {/* Section: Pricing Cards */}
          <View style={styles.pricingSectionHeader}>
            <AppText variant="caption" weight="800" color="#D4A017" style={styles.sectionTag}>
              CHOOSE A PLAN
            </AppText>
            <AppText variant="body" weight="800" color="#0F3E26" style={styles.sectionTitle}>
              Simple, Transparent Pricing
            </AppText>
          </View>

          {loading ? (
            <SkeletonPremiumPlans />
          ) : (
            <>
              <View style={styles.planRow}>
                {renderPlanCard(monthlyPlan)}
                {renderPlanCard(yearlyPlan, true)}
              </View>

              {isPremium ? (
                <View style={styles.banner}>
                  <AuthInfoBanner message="You already have premium active on this account." />
                </View>
              ) : null}
            </>
          )}

          {/* Section: Trust Indicators */}
          <View style={styles.trustGrid}>
            {TRUST_ITEMS.map((item, idx) => (
              <View key={idx} style={styles.trustCard}>
                <View style={styles.trustIconContainer}>
                  <Ionicons name={item.icon} size={18} color="#1E5838" />
                </View>
                <AppText variant="caption" weight="800" color="#0F3E26" style={styles.trustTitle}>
                  {item.title}
                </AppText>
                <AppText variant="caption" color="#64748B" style={styles.trustDesc}>
                  {item.desc}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA Area */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <PrimaryButton
          title={isPremium ? 'Premium Active' : (selectedPlanId === 'yearly' ? 'Upgrade & Save 20%' : 'Upgrade to Premium')}
          onPress={handleStartTrial}
          disabled={loading || isPremium || !selectedPlan}
          style={styles.ctaBtn}
        />

        <View style={styles.disclaimerRow}>
          <AppText variant="caption" color="#64748B" style={styles.disclaimerText}>
            Cancel anytime in store settings. By subscribing, you agree to our{' '}
          </AppText>
          <Pressable onPress={() => setTermsVisible(true)} hitSlop={6}>
            <AppText variant="caption" weight="800" color="#1E5838" style={styles.link}>
              Terms of Use
            </AppText>
          </Pressable>
          <AppText variant="caption" color="#64748B" style={styles.disclaimerText}>
            {' '}and{' '}
          </AppText>
          <Pressable onPress={() => setTermsVisible(true)} hitSlop={6}>
            <AppText variant="caption" weight="800" color="#1E5838" style={styles.link}>
              Privacy Policy
            </AppText>
          </Pressable>
          <AppText variant="caption" color="#64748B" style={styles.disclaimerText}>
            .
          </AppText>
        </View>
      </View>

      <SecureCheckoutSheet
        visible={checkoutVisible}
        plan={selectedPlan}
        onClose={() => setCheckoutVisible(false)}
        onConfirm={handleConfirmPayment}
        loading={checkoutLoading}
        error={checkoutError}
      />

      {/* Premium Achievement / Celebration Congratulations Success Modal */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSuccessVisible(false);
          router.back();
        }}
      >
        <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.successModalCard, { transform: [{ scale: scaleAnim }] }]}>
            
            {/* Visual Compact Celebration Header with Gradients & Confetti elements */}
            <LinearGradient
              colors={['#06190E', '#0A2D1B', '#114427', '#D4A017']}
              locations={[0, 0.45, 0.9, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successGradientHeader}
            >
              {/* Confetti & Sparkles Decorative Overlays */}
              <Animated.View style={[styles.sparkleDecoration, { left: 40, top: 20, transform: [{ scale: sparkleAnim1 }] }]}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </Animated.View>
              <Animated.View style={[styles.sparkleDecoration, { right: 50, top: 25, transform: [{ scale: sparkleAnim2 }] }]}>
                <Ionicons name="flash" size={14} color="#D4A017" />
              </Animated.View>
              <Animated.View style={[styles.sparkleDecoration, { left: 70, bottom: 20, transform: [{ scale: sparkleAnim2 }] }]}>
                <Ionicons name="sparkles" size={12} color="#D4A017" />
              </Animated.View>
              <Animated.View style={[styles.sparkleDecoration, { right: 80, bottom: 15, transform: [{ scale: sparkleAnim1 }] }]}>
                <Ionicons name="star" size={12} color="#FFFFFF" />
              </Animated.View>

              {/* Gold Crown Trophy Container */}
              <Animated.View
                style={[
                  styles.successIconOuter,
                  {
                    transform: [
                      { scale: crownScale },
                      { rotate: crownRotation },
                    ],
                  },
                ]}
              >
                <Ionicons name="ribbon" size={38} color="#D4A017" />
              </Animated.View>

              {/* Floating Exclusive Badge */}
              <View style={styles.successPremiumBadge}>
                <Ionicons name="star" size={10} color="#06190E" />
                <AppText variant="caption" weight="800" color="#06190E" style={styles.successPremiumBadgeText}>
                  PREMIUM ACTIVE
                </AppText>
              </View>
            </LinearGradient>

            <View style={styles.successBody}>
              <AppText variant="h2" weight="800" color="#0F3E26" style={styles.successTitle}>
                🎉 Welcome to Premium
              </AppText>
              <AppText variant="bodySmall" color="#475569" style={styles.successSubtitle}>
                Your premium membership is now active and ready to use.
              </AppText>

              {/* Premium Feature Cards Section */}
              <View style={styles.premiumCardsContainer}>
                {SUCCESS_BENEFITS.map((item, idx) => (
                  <View key={idx} style={styles.premiumSuccessCard}>
                    <View style={styles.premiumSuccessCardIconBox}>
                      <Ionicons name={item.icon} size={18} color="#D4A017" />
                    </View>
                    <View style={styles.premiumSuccessCardText}>
                      <AppText variant="bodySmall" weight="800" color="#0F3E26">
                        {item.title}
                      </AppText>
                      <AppText variant="caption" color="#64748B" style={styles.premiumSuccessCardDesc}>
                        {item.desc}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>

              {/* Bottom CTAs */}
              <TouchableOpacity
                style={styles.successBtn}
                onPress={() => {
                  setSuccessVisible(false);
                  router.back();
                }}
                activeOpacity={0.8}
              >
                <AppText style={styles.successBtnText}>Start Exploring</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successSecondaryBtn}
                onPress={scrollToBenefits}
                activeOpacity={0.7}
              >
                <AppText variant="bodySmall" weight="800" color="#1E5838">
                  View Premium Features
                </AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <TermsAndConditionsSheet visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  heroWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 40,
    position: 'relative',
    overflow: 'hidden',
  },
  heroWatermarkContainer: {
    position: 'absolute',
    right: -40,
    bottom: -20,
    width: '60%',
    height: '100%',
    opacity: 0.15,
  },
  heroWatermark: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroContent: {
    marginTop: 80,
    alignItems: 'flex-start',
  },
  crownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  crownText: {
    fontSize: 9,
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    lineHeight: 18,
    opacity: 0.9,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
  },
  contentBlock: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: -24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 170, // Spacing for sticky bottom CTA
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 4,
  },
  pricingSectionHeader: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTag: {
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  benefitsList: {
    gap: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  benefitRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  benefitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitDesc: {
    marginTop: 2,
    lineHeight: 15,
  },
  planRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 2,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    minHeight: 130,
    ...Shadows.md,
  },
  planCardSelected: {
    borderColor: '#1E5838',
    backgroundColor: '#F0FAF3',
  },
  planCardUnselected: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  planCardRecommendedSelected: {
    borderColor: '#D4A017',
    backgroundColor: '#FFFDF5',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: '#D4A017',
    borderRadius: Radius.full,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  popularText: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  planName: {
    letterSpacing: 0.5,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#1E5838',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: '#1E5838',
  },
  priceContainer: {
    marginTop: Spacing.md,
  },
  planPrice: {
    fontSize: 24,
    lineHeight: 28,
  },
  planPeriod: {
    fontSize: 10,
    marginTop: 2,
  },
  banner: {
    marginBottom: Spacing.md,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  trustCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    ...Shadows.sm,
  },
  trustIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: '#F0FAF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  trustTitle: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'center',
  },
  trustDesc: {
    fontSize: 9,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Shadows.lg,
  },
  ctaBtn: {
    backgroundColor: '#1E5838',
    borderColor: '#1E5838',
    height: 48,
    borderRadius: Radius.lg,
    shadowColor: '#1E5838',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: Spacing.sm,
  },
  disclaimerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
  },
  link: {
    fontSize: 9.5,
    textDecorationLine: 'underline',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  successGradientHeader: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sparkleDecoration: {
    position: 'absolute',
  },
  successIconOuter: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4A017',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  successPremiumBadge: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4A017',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  successPremiumBadgeText: {
    fontSize: 8.5,
    letterSpacing: 1,
  },
  successBody: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
    textAlign: 'center',
  },
  successSubtitle: {
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  premiumCardsContainer: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  premiumSuccessCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  premiumSuccessCardIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  premiumSuccessCardText: {
    flex: 1,
  },
  premiumSuccessCardDesc: {
    marginTop: 2,
    lineHeight: 14,
  },
  successBtn: {
    width: '100%',
    height: 50,
    borderRadius: Radius.lg,
    backgroundColor: '#1E5838',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E5838',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: Spacing.xs,
  },
  successBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  successSecondaryBtn: {
    paddingVertical: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
});
