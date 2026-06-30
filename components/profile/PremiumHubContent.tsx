import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { useToast } from '@/hooks/useToast';
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
import { PrivacyPolicySheet } from './PrivacyPolicySheet';
import {
  formatPlanPrice,
  planPeriodLabel,
} from './profileTheme';
import { SkeletonPremiumPlans } from '@/components/ui/skeletons';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';

const HERO_ILLUSTRATION = require('../../assets/images/onboarding_health.png');

// ── Benefit Grid (2×N cards) ──────────────────────────────────────────────
const BENEFITS = [
  {
    icon: 'paw' as const,
    label: 'Unlimited Pets',
    desc: 'Add and manage every pet without any cap',
    color: '#1E5838',
    bg: '#E8F5ED',
  },
  {
    icon: 'people' as const,
    label: 'Unlimited Family',
    desc: 'Co-manage pets with your entire family',
    color: '#1E5838',
    bg: '#E8F5ED',
  },
  {
    icon: 'notifications' as const,
    label: 'Smart Reminders',
    desc: 'Advanced alerts for meals, meds & walks',
    color: '#C97D10',
    bg: '#FFF9E6',
  },
  {
    icon: 'bar-chart' as const,
    label: 'Health Analytics',
    desc: 'Deep-dive charts: weight, activity & growth',
    color: '#1E5838',
    bg: '#E8F5ED',
  },
  {
    icon: 'wallet' as const,
    label: 'Expense Insights',
    desc: 'Detailed budgeting and category trends',
    color: '#C97D10',
    bg: '#FFF9E6',
  },
  {
    icon: 'cloud-upload' as const,
    label: 'Cloud Backup',
    desc: 'Your pet data backed up automatically',
    color: '#1E5838',
    bg: '#E8F5ED',
  },
  {
    icon: 'flash' as const,
    label: 'Early Access',
    desc: 'First to try every new feature we ship',
    color: '#C97D10',
    bg: '#FFF9E6',
  },
  {
    icon: 'headset' as const,
    label: 'Priority Support',
    desc: 'Jump the queue with dedicated support',
    color: '#1E5838',
    bg: '#E8F5ED',
  },
];

const SUCCESS_BENEFITS = [
  {
    icon: 'paw' as const,
    title: 'Unlimited Pet Profiles',
    desc: 'Manage all your pets with zero restrictions.',
  },
  {
    icon: 'notifications' as const,
    title: 'Smart Reminders',
    desc: 'Never miss feeding, meds, walks or vaccines.',
  },
  {
    icon: 'analytics' as const,
    title: 'Premium Insights',
    desc: 'Advanced health, weight, activity tracking.',
  },
  {
    icon: 'cloud-upload' as const,
    title: 'Cloud Backup',
    desc: 'Your data safely backed up at all times.',
  },
];

const TRUST_ITEMS = [
  { icon: 'shield-checkmark' as const, title: 'Secure Payment', desc: '256-bit encryption' },
  { icon: 'refresh' as const, title: 'Cancel Anytime', desc: 'Easy store management' },
  { icon: 'wallet' as const, title: 'No Hidden Fees', desc: 'Transparent pricing' },
  { icon: 'people' as const, title: 'Family Sharing', desc: 'Included in plan' },
];

const ALLOWED_PLAN_IDS = new Set(['monthly', 'yearly']);

// ── Simple confetti particle ──────────────────────────────────────────────
const CONFETTI_COLORS = ['#D4A017', '#1E5838', '#FFFFFF', '#F59E0B', '#10B981'];
const NUM_PARTICLES = 18;

function ConfettiParticle({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(y, { toValue: -180, duration: 1200, useNativeDriver: true }),
        Animated.timing(rotation, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        bottom: 0,
        width: 8,
        height: 8,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: y }, { rotate: spin }],
      }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export function PremiumHubContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { token, user, setSession } = useAuth();
  const { pet } = useActivePet(token);
  const { showToast } = useToast();

  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Hero entrance animations
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;

  // Plan selection spring
  const planScale = useRef(new Animated.Value(1)).current;

  // Success modal animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const crownRotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim1 = useRef(new Animated.Value(0)).current;
  const sparkleAnim2 = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  // Hero entrance on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

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
      Alert.alert('Pet Horizon Premium', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Success modal animations
  useEffect(() => {
    if (successVisible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
      crownRotateAnim.setValue(0);
      sparkleAnim1.setValue(0);
      sparkleAnim2.setValue(0);
      setShowConfetti(false);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(crownRotateAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(250),
          Animated.parallel([
            Animated.spring(sparkleAnim1, { toValue: 1, friction: 5, useNativeDriver: true }),
            Animated.spring(sparkleAnim2, { toValue: 1, friction: 5, useNativeDriver: true }),
          ]),
        ]),
      ]).start();

      // Trigger confetti with a short delay
      setTimeout(() => setShowConfetti(true), 100);
    }
  }, [successVisible]);

  const selectedPlan = plans.find((p) => p.planId === selectedPlanId) ?? null;
  const monthlyPlan = plans.find((p) => p.planId === 'monthly');
  const yearlyPlan = plans.find((p) => p.planId === 'yearly');

  // Compute per-month price for yearly plan
  const yearlyMonthlyEquiv =
    yearlyPlan && monthlyPlan
      ? `${formatPlanPrice(yearlyPlan.price / 12)}/mo`
      : null;

  // Compute savings %
  const savingsPercent =
    yearlyPlan && monthlyPlan && monthlyPlan.price > 0
      ? Math.round((1 - yearlyPlan.price / (monthlyPlan.price * 12)) * 100)
      : 20;

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    Animated.sequence([
      Animated.timing(planScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(planScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const handleStartTrial = () => {
    if (isPremium) {
      Alert.alert('Already Premium', 'You already have an active premium subscription.');
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

  const handleRestorePurchases = async () => {
    if (restoring) return;
    setRestoring(true);
    // Simulate restore attempt
    await new Promise((r) => setTimeout(r, 1200));
    setRestoring(false);
    showToast('No previous purchases found. Contact support if you believe this is an error.');
  };

  const scrollToBenefits = () => {
    setSuccessVisible(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const crownRotation = crownRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });
  const crownScale = crownRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.1],
  });

  const userName = user?.fullName?.split(' ')[0] ?? 'there';

  // ── Plan Card ─────────────────────────────────────────────────────────
  const renderPlanCard = (plan: PremiumPlan | undefined, isRecommended = false) => {
    if (!plan) return null;
    const selected = selectedPlanId === plan.planId;

    return (
      <Animated.View
        key={plan.planId}
        style={{ transform: selected ? [{ scale: planScale }] : [] }}
      >
        <TouchableOpacity
          style={[
            styles.planCard,
            selected && (isRecommended ? styles.planCardRecommendedSelected : styles.planCardSelected),
            !selected && styles.planCardUnselected,
          ]}
          onPress={() => handleSelectPlan(plan.planId)}
          activeOpacity={0.88}
        >
          {/* Recommended banner */}
          {isRecommended && (
            <LinearGradient
              colors={['#C97D10', '#D4A017']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.recommendedBanner}
            >
              <Ionicons name="star" size={10} color="#FFFFFF" />
              <AppText variant="caption" weight="800" color="#FFFFFF" style={styles.recommendedText}>
                BEST VALUE — SAVE {savingsPercent}%
              </AppText>
            </LinearGradient>
          )}

          <View style={[styles.planCardInner, isRecommended && styles.planCardInnerWithBanner]}>
            {/* Left: name + period breakdown */}
            <View style={styles.planLeft}>
              <AppText
                variant="body"
                weight="800"
                color={selected ? '#0A2419' : '#475569'}
                style={styles.planName}
              >
                {plan.name}
              </AppText>
              {isRecommended && yearlyMonthlyEquiv ? (
                <AppText variant="caption" color={selected ? '#1E5838' : '#94A3B8'} style={styles.planBreakdown}>
                  {yearlyMonthlyEquiv} · billed annually
                </AppText>
              ) : (
                <AppText variant="caption" color={selected ? '#1E5838' : '#94A3B8'} style={styles.planBreakdown}>
                  {planPeriodLabel(plan.planId, plan.periodDays)}
                </AppText>
              )}
            </View>

            {/* Right: price + radio */}
            <View style={styles.planRight}>
              <AppText
                variant="h2"
                weight="800"
                color={selected ? '#0A2419' : '#1E293B'}
                style={styles.planPrice}
              >
                {formatPlanPrice(plan.price)}
              </AppText>
              <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <LinearGradient
          colors={['#061A0F', '#0B2E1A', '#124728']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroWrapper}
        >
          {/* Watermark image */}
          <View style={styles.heroWatermarkContainer} pointerEvents="none">
            <Image source={HERO_ILLUSTRATION} style={styles.heroWatermark} contentFit="contain" />
          </View>

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: Math.max(insets.top + 8, 20) }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Hero text with entrance animation */}
          <Animated.View
            style={[
              styles.heroContent,
              { opacity: heroFade, transform: [{ translateY: heroSlide }] },
            ]}
          >
            {/* Gold badge */}
            <View style={styles.goldBadge}>
              <Ionicons name="sparkles" size={10} color="#D4A017" />
              <AppText variant="caption" weight="800" color="#D4A017" style={styles.goldBadgeText}>
                Pet Horizon Premium
              </AppText>
            </View>

            <AppText variant="h1" weight="800" color="#FFFFFF" style={styles.heroTitle}>
              Give Your Pet the{'\n'}Best Care Possible
            </AppText>
            <AppText variant="bodySmall" color="rgba(203,213,225,0.9)" style={styles.heroSubtitle}>
              Unlimited profiles, smart reminders, health analytics, and family collaboration — all in one app.
            </AppText>

            {/* Social proof */}
            <View style={styles.socialProof}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={12} color="#D4A017" />
                ))}
              </View>
              <AppText variant="caption" color="rgba(203,213,225,0.85)" style={styles.socialProofText}>
                Rated 4.9 by pet parents worldwide
              </AppText>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Content Sheet ────────────────────────────────────────── */}
        <View style={styles.contentBlock}>

          {/* ── Benefits Grid ─────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTagPill}>
              <AppText variant="caption" weight="800" color="#D4A017" style={styles.sectionTagText}>
                WHAT YOU GET
              </AppText>
            </View>
            <AppText variant="body" weight="800" color="#0A2419" style={styles.sectionTitle}>
              Everything Your Pet Deserves
            </AppText>
          </View>

          <View style={styles.benefitsGrid}>
            {BENEFITS.map((item) => (
              <View key={item.label} style={styles.benefitCard}>
                <View style={[styles.benefitIconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <AppText variant="bodySmall" weight="800" color="#0A2419" style={styles.benefitLabel}>
                  {item.label}
                </AppText>
                <AppText variant="caption" color="#64748B" style={styles.benefitDesc}>
                  {item.desc}
                </AppText>
              </View>
            ))}
          </View>

          {/* ── Plan Selection ─────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTagPill}>
              <AppText variant="caption" weight="800" color="#D4A017" style={styles.sectionTagText}>
                CHOOSE A PLAN
              </AppText>
            </View>
            <AppText variant="body" weight="800" color="#0A2419" style={styles.sectionTitle}>
              Simple, Transparent Pricing
            </AppText>
          </View>

          {loading ? (
            <SkeletonPremiumPlans />
          ) : (
            <View style={styles.planStack}>
              {renderPlanCard(yearlyPlan, true)}
              {renderPlanCard(monthlyPlan, false)}

              {isPremium ? (
                <View style={styles.activeBanner}>
                  <AuthInfoBanner message="You already have an active premium subscription." />
                </View>
              ) : null}

              {/* Restore Purchases */}
              <TouchableOpacity
                style={styles.restoreRow}
                onPress={handleRestorePurchases}
                activeOpacity={0.7}
                disabled={restoring}
              >
                {restoring ? (
                  <ActivityIndicator size="small" color="#1E5838" />
                ) : (
                  <Ionicons name="refresh" size={13} color="#64748B" />
                )}
                <AppText variant="caption" color="#64748B" style={styles.restoreText}>
                  {restoring ? 'Checking purchases…' : 'Restore Purchases'}
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Trust Grid ─────────────────────────────────────────── */}
          <View style={styles.trustGrid}>
            {TRUST_ITEMS.map((item) => (
              <View key={item.title} style={styles.trustCard}>
                <View style={styles.trustIconBadge}>
                  <Ionicons name={item.icon} size={16} color="#1E5838" />
                </View>
                <AppText variant="caption" weight="800" color="#0A2419" style={styles.trustTitle}>
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

      {/* ── Sticky Footer CTA ─────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            (loading || isPremium || !selectedPlan) && styles.ctaBtnDisabled,
          ]}
          onPress={handleStartTrial}
          disabled={loading || isPremium || !selectedPlan}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={isPremium ? ['#64748B', '#94A3B8'] : ['#1A4A2E', '#1E5838']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.7)" />
                <AppText variant="body" weight="800" color="#FFFFFF" style={styles.ctaBtnText}>
                  {isPremium
                    ? 'Premium Active'
                    : selectedPlanId === 'yearly'
                    ? `Upgrade & Save ${savingsPercent}%`
                    : 'Upgrade to Premium'}
                </AppText>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Legal disclaimer */}
        <View style={styles.disclaimerRow}>
          <AppText variant="caption" color="#94A3B8" style={styles.disclaimerText}>
            Cancel anytime. By subscribing you agree to our{' '}
          </AppText>
          <Pressable onPress={() => setTermsVisible(true)} hitSlop={6}>
            <AppText variant="caption" weight="700" color="#1E5838" style={styles.link}>
              Terms of Use
            </AppText>
          </Pressable>
          <AppText variant="caption" color="#94A3B8" style={styles.disclaimerText}> & </AppText>
          <Pressable onPress={() => setPrivacyVisible(true)} hitSlop={6}>
            <AppText variant="caption" weight="700" color="#1E5838" style={styles.link}>
              Privacy Policy
            </AppText>
          </Pressable>
          <AppText variant="caption" color="#94A3B8" style={styles.disclaimerText}>.</AppText>
        </View>
      </View>

      {/* ── Checkout Sheet ───────────────────────────────────────── */}
      <SecureCheckoutSheet
        visible={checkoutVisible}
        plan={selectedPlan}
        onClose={() => setCheckoutVisible(false)}
        onConfirm={handleConfirmPayment}
        loading={checkoutLoading}
      />

      {/* ── Legal Sheets ─────────────────────────────────────────── */}
      <TermsAndConditionsSheet visible={termsVisible} onClose={() => setTermsVisible(false)} />
      <PrivacyPolicySheet visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />

      {/* ── Success Modal ─────────────────────────────────────────── */}
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
          <Animated.View
            style={[styles.successModalCard, { transform: [{ scale: scaleAnim }] }]}
          >
            {/* Confetti particles */}
            {showConfetti && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {Array.from({ length: NUM_PARTICLES }, (_, i) => (
                  <ConfettiParticle
                    key={i}
                    delay={i * 40}
                    color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                    startX={20 + (i * 17) % 300}
                  />
                ))}
              </View>
            )}

            {/* Gradient header */}
            <LinearGradient
              colors={['#061A0F', '#0B2E1A', '#124728']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successGradientHeader}
            >
              {/* Decorative sparkles */}
              <Animated.View style={[styles.sparkleDeco, { left: 30, top: 18, transform: [{ scale: sparkleAnim1 }] }]}>
                <Ionicons name="sparkles" size={18} color="rgba(212,160,23,0.8)" />
              </Animated.View>
              <Animated.View style={[styles.sparkleDeco, { right: 36, top: 22, transform: [{ scale: sparkleAnim2 }] }]}>
                <Ionicons name="flash" size={15} color="rgba(255,255,255,0.5)" />
              </Animated.View>
              <Animated.View style={[styles.sparkleDeco, { left: 60, bottom: 18, transform: [{ scale: sparkleAnim2 }] }]}>
                <Ionicons name="star" size={13} color="rgba(212,160,23,0.6)" />
              </Animated.View>
              <Animated.View style={[styles.sparkleDeco, { right: 55, bottom: 14, transform: [{ scale: sparkleAnim1 }] }]}>
                <Ionicons name="sparkles" size={11} color="rgba(255,255,255,0.4)" />
              </Animated.View>

              {/* Crown icon */}
              <Animated.View
                style={[
                  styles.crownRing,
                  { transform: [{ scale: crownScale }, { rotate: crownRotation }] },
                ]}
              >
                <MaterialCommunityIcons name="crown" size={40} color="#D4A017" />
              </Animated.View>

              {/* PREMIUM ACTIVE badge */}
              <View style={styles.premiumActiveBadge}>
                <Ionicons name="checkmark-circle" size={11} color="#06190E" />
                <AppText variant="caption" weight="800" color="#06190E" style={styles.premiumActiveBadgeText}>
                  PREMIUM ACTIVE
                </AppText>
              </View>
            </LinearGradient>

            {/* Body */}
            <ScrollView
              style={styles.successBody}
              contentContainerStyle={styles.successBodyContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <AppText variant="h2" weight="800" color="#0A2419" style={styles.successTitle}>
                🎉 Welcome, {userName}!
              </AppText>
              <AppText variant="bodySmall" color="#475569" style={styles.successSubtitle}>
                Your Pet Horizon Premium membership is now active. Enjoy the full experience — your pets deserve the best.
              </AppText>

              {/* Success benefit cards — 2-column grid */}
              <View style={styles.successBenefitsGrid}>
                {SUCCESS_BENEFITS.map((item, idx) => (
                  <View key={idx} style={styles.successBenefitCard}>
                    <View style={styles.successBenefitIconBox}>
                      <Ionicons name={item.icon} size={16} color="#D4A017" />
                    </View>
                    <AppText variant="caption" weight="800" color="#0A2419" style={styles.successBenefitTitle}>
                      {item.title}
                    </AppText>
                    <AppText variant="caption" color="#64748B" style={styles.successBenefitDesc}>
                      {item.desc}
                    </AppText>
                  </View>
                ))}
              </View>

              {/* Primary CTA */}
              <TouchableOpacity
                style={styles.successBtn}
                onPress={() => {
                  setSuccessVisible(false);
                  router.back();
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#1A4A2E', '#1E5838']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.successBtnGradient}
                >
                  <AppText variant="body" weight="800" color="#FFFFFF">
                    Start Exploring
                  </AppText>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary CTA */}
              <TouchableOpacity
                style={styles.successSecondaryBtn}
                onPress={scrollToBenefits}
                activeOpacity={0.7}
              >
                
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140,
  },

  // ── Hero ──────────────────────────────────────────────────────────────
  heroWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 48,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 300,
  },
  heroWatermarkContainer: {
    position: 'absolute',
    right: -30,
    bottom: -20,
    width: '55%',
    height: '110%',
    opacity: 0.1,
  },
  heroWatermark: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    left: Spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroContent: {
    marginTop: 80,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,160,23,0.14)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.28)',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  goldBadgeText: {
    fontSize: 9.5,
    letterSpacing: 1.0,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 39,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  socialProofText: {
    fontSize: 11,
  },

  // ── Content block ─────────────────────────────────────────────────────
  contentBlock: {
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // ── Section header ────────────────────────────────────────────────────
  sectionHeaderRow: {
    marginBottom: Spacing.md,
    gap: 4,
  },
  sectionTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF9E6',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    marginBottom: 2,
  },
  sectionTagText: {
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: 18,
  },

  // ── Benefits grid (2-column) ──────────────────────────────────────────
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8EFF5',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLabel: {
    fontSize: 13,
  },
  benefitDesc: {
    fontSize: 11,
    lineHeight: 15,
  },

  // ── Plan cards (stacked, full-width) ──────────────────────────────────
  planStack: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  planCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  planCardSelected: {
    borderColor: '#1E5838',
    backgroundColor: '#F0FAF4',
  },
  planCardRecommendedSelected: {
    borderColor: '#D4A017',
    backgroundColor: '#FFFDF5',
  },
  planCardUnselected: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  recommendedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
  },
  recommendedText: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  planCardInnerWithBanner: {},
  planLeft: {
    flex: 1,
    gap: 2,
  },
  planRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  planName: {
    fontSize: 15,
  },
  planBreakdown: {
    fontSize: 11,
  },
  planPrice: {
    fontSize: 22,
    lineHeight: 26,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
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
    borderRadius: 5,
    backgroundColor: '#1E5838',
  },

  // ── Restore purchases ─────────────────────────────────────────────────
  restoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.sm,
  },
  restoreText: {
    fontSize: 12,
  },

  activeBanner: { marginTop: 4 },

  // ── Trust grid ────────────────────────────────────────────────────────
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  trustCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E8EFF5',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  trustIconBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  trustDesc: {
    fontSize: 10,
    textAlign: 'center',
  },

  // ── Sticky footer ─────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E8EFF5',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 12 },
    }),
  },
  ctaBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#1E5838', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  ctaBtnDisabled: {
    opacity: 0.55,
  },
  ctaBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: Radius.full,
  },
  ctaBtnText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  disclaimerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 2,
  },
  disclaimerText: {
    fontSize: 10,
  },
  link: {
    fontSize: 10,
    textDecorationLine: 'underline',
  },

  // ── Success modal ─────────────────────────────────────────────────────
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,15,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  successGradientHeader: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleDeco: {
    position: 'absolute',
  },
  crownRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.5)',
  },
  premiumActiveBadge: {
    position: 'absolute',
    bottom: -14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4A017',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  premiumActiveBadgeText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  successBody: {
    maxHeight: 420,
  },
  successBodyContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
    color: '#64748B',
  },
  successBenefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  successBenefitCard: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E8EFF5',
    alignItems: 'flex-start',
  },
  successBenefitIconBox: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBenefitTitle: {
    fontSize: 11.5,
  },
  successBenefitDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  successBtn: {
    width: '100%',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#1E5838', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  successBtnGradient: {
    height: 52,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successSecondaryBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
});
