import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { AppBrandModal } from '@/components/ui/AppBrandModal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppText } from '@/components/ui/AppText';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { getErrorMessage } from '@/lib/api/errors';
import { resolveMediaUrl } from '@/lib/mediaUrl';
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
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';

const FALLBACK_HERO = require('../../assets/images/onboarding.png');

const FEATURES = [
  { icon: 'paw-outline' as const, label: 'Unlimited Pets', desc: 'Add all your family pets' },
  { icon: 'notifications-outline' as const, label: 'Smart Reminders', desc: 'Custom care alerts' },
  { icon: 'bar-chart-outline' as const, label: 'Pro Analytics', desc: 'Health & expense graphs' },
];

const ALLOWED_PLAN_IDS = new Set(['monthly', 'yearly']);

export function PremiumHubContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const heroSource = useMemo(() => {
    const url = resolveMediaUrl(pet?.image);
    return url ? { uri: url } : FALLBACK_HERO;
  }, [pet?.image]);

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

  const renderPlanCard = (plan: PremiumPlan | undefined, popular?: boolean) => {
    if (!plan) return null;
    const selected = selectedPlanId === plan.planId;

    return (
      <TouchableOpacity
        key={plan.planId}
        style={[
          styles.planCard,
          selected && styles.planCardSelected,
          popular && styles.planPopular,
        ]}
        onPress={() => setSelectedPlanId(plan.planId)}
        activeOpacity={0.9}
      >
        {popular && (
          <View style={styles.popularBadge}>
            <AppText variant="caption" weight="800" color="#FFFFFF" style={styles.popularText}>
              BEST VALUE
            </AppText>
          </View>
        )}
        <AppText variant="caption" weight="800" color={selected ? Colors.primary : Colors.textMuted}>
          {plan.name.toUpperCase()}
        </AppText>
        <AppText variant="h2" weight="800" color={Colors.text} style={styles.planPrice}>
          {formatPlanPrice(plan.price)}
        </AppText>
        <AppText variant="caption" color={Colors.textMuted}>
          {planPeriodLabel(plan.planId, plan.periodDays)}
        </AppText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroContainer}>
        <Image source={heroSource} style={styles.hero} contentFit="cover" />
        <View style={styles.overlay} />
      </View>

      <TouchableOpacity
        style={[styles.backBtn, { top: Math.max(insets.top, Spacing.sm) }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.sheetContent}
        >
          <View style={styles.headerBlock}>
            <StatusBadge status="premium" style={styles.premiumBadge} />
            <AppText variant="h1" weight="800" color={Colors.text} style={styles.title}>
              Unlock Full Potential
            </AppText>
            <AppText variant="bodySmall" color={Colors.textMuted} style={styles.subtitle}>
              Take care of your pets like a pro with premium features.
            </AppText>
          </View>

          <View style={styles.featuresBlock}>
            {FEATURES.map((feature) => (
              <AppCard key={feature.label} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={20} color={Colors.primary} />
                </View>
                <View style={styles.featureTextContainer}>
                  <AppText variant="bodySmall" weight="700" color={Colors.text}>
                    {feature.label}
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    {feature.desc}
                  </AppText>
                </View>
              </AppCard>
            ))}
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

          <PrimaryButton
            title={isPremium ? 'Premium Active' : 'Start 7-Day Free Trial'}
            onPress={handleStartTrial}
            disabled={loading || isPremium || !selectedPlan}
            style={styles.ctaBtn}
          />

          <View style={styles.disclaimerRow}>
            <AppText variant="caption" color={Colors.textMuted}>
              Cancel anytime.{' '}
            </AppText>
            <Pressable onPress={() => setTermsVisible(true)} hitSlop={6}>
              <AppText variant="caption" weight="800" color={Colors.primary} style={styles.link}>
                Terms & Conditions
              </AppText>
            </Pressable>
            <AppText variant="caption" color={Colors.textMuted}>
              {' '}
              apply.
            </AppText>
          </View>
        </ScrollView>
      </View>

      <SecureCheckoutSheet
        visible={checkoutVisible}
        plan={selectedPlan}
        onClose={() => setCheckoutVisible(false)}
        onConfirm={handleConfirmPayment}
        loading={checkoutLoading}
        error={checkoutError}
      />

      <AppBrandModal
        visible={successVisible}
        title="Congratulations!"
        message="Your premium subscription is now active. Enjoy unlimited pets, smart reminders, and pro stats."
        confirmLabel="Continue"
        onConfirm={() => {
          setSuccessVisible(false);
          router.back();
        }}
      />

      <TermsAndConditionsSheet visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '36%',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sheet: {
    flex: 1,
    marginTop: '32%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  sheetContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  premiumBadge: {
    marginBottom: Spacing.xs,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
  },
  featuresBlock: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  planRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    ...Shadows.sm,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  planPopular: {
    borderColor: Colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  planPrice: {
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  banner: {
    marginBottom: Spacing.md,
  },
  ctaBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  disclaimerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    textDecorationLine: 'underline',
  },
});
