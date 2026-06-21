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
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBrandModal } from '@/components/ui/AppBrandModal';
import { AppButton } from '@/components/ui/AppButton';
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
import { ProfileScreenHeader } from './ProfileScreenHeader';
import { SecureCheckoutSheet } from './SecureCheckoutSheet';
import { TermsAndConditionsSheet } from './TermsAndConditionsSheet';
import {
  ProfileTheme,
  formatPlanPrice,
  planPeriodLabel,
} from './profileTheme';
import { SkeletonPremiumPlans } from '@/components/ui/skeletons';

const FALLBACK_HERO = require('../../assets/images/onboarding.png');

const FEATURES = [
  { icon: 'paw' as const, label: 'Unlimited Pets' },
  { icon: 'notifications' as const, label: 'Smart Reminders' },
  { icon: 'stats-chart' as const, label: 'Pro Stats' },
];

const ALLOWED_PLAN_IDS = new Set(['monthly', 'yearly']);

export function PremiumHubContent() {
  const router = useRouter();
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
        style={[styles.planCard, selected && styles.planCardSelected, popular && styles.planPopular]}
        onPress={() => setSelectedPlanId(plan.planId)}
        activeOpacity={0.9}
      >
        {popular ? (
          <View style={styles.popularBadge}>
            <AppText variant="caption" weight="700" color="#F0C419">
              POPULAR
            </AppText>
          </View>
        ) : null}
        <AppText variant="body" weight="700" color={ProfileTheme.text}>
          {plan.name}
        </AppText>
        <AppText variant="h3" weight="800" color={ProfileTheme.text} style={styles.planPrice}>
          {formatPlanPrice(plan.price)}
        </AppText>
        <AppText variant="caption" color={ProfileTheme.textMuted}>
          {planPeriodLabel(plan.planId, plan.periodDays)}
        </AppText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Image source={heroSource} style={styles.hero} contentFit="cover" />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <ProfileScreenHeader title="" onBack={() => router.back()} />
      </SafeAreaView>

      <View style={styles.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.sheetContent}
        >
          <AppText variant="caption" weight="700" color={ProfileTheme.green} style={styles.kicker}>
            PREMIUM HUB
          </AppText>
          <AppText variant="h2" weight="800" color={ProfileTheme.text} style={styles.title}>
            Unlock Full Potential
          </AppText>

          <View style={styles.featureRow}>
            {FEATURES.map((feature) => (
              <View key={feature.label} style={styles.featureItem}>
                <Ionicons name={feature.icon} size={18} color={ProfileTheme.green} />
                <AppText variant="caption" weight="600" color={ProfileTheme.textMuted}>
                  {feature.label}
                </AppText>
              </View>
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

          <AppButton
            title={isPremium ? 'Premium Active' : 'Start 7-Day Free Trial'}
            onPress={handleStartTrial}
            disabled={loading || isPremium || !selectedPlan}
            variant="success"
            size="md"
            style={styles.ctaBtn}
            textStyle={styles.ctaText}
            icon={
              !isPremium ? (
                <Ionicons name="arrow-forward" size={18} color={ProfileTheme.surface} />
              ) : undefined
            }
          />

          <View style={styles.disclaimerRow}>
            <AppText variant="caption" color={ProfileTheme.textMuted}>
              Cancel anytime.{' '}
            </AppText>
            <Pressable onPress={() => setTermsVisible(true)} hitSlop={6}>
              <AppText variant="caption" weight="700" color={ProfileTheme.green} style={styles.link}>
                Terms & Conditions
              </AppText>
            </Pressable>
            <AppText variant="caption" color={ProfileTheme.textMuted}>
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
    backgroundColor: ProfileTheme.background,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '34%',
  },
  safeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    flex: 1,
    marginTop: '30%',
    backgroundColor: ProfileTheme.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  kicker: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  loader: {
    marginVertical: 16,
  },
  planRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: ProfileTheme.border,
  },
  planCardSelected: {
    borderColor: ProfileTheme.green,
    backgroundColor: '#F1FAF1',
  },
  planPopular: {
    borderColor: ProfileTheme.green,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  planPrice: {
    marginTop: 8,
  },
  banner: {
    marginBottom: 12,
  },
  ctaBtn: {
    width: '100%',
    borderRadius: 999,
    minHeight: 52,
    marginTop: 4,
    marginBottom: 10,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
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
