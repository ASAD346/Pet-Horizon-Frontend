import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/api/errors';
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
import {
  ProfileTheme,
  formatPlanPrice,
  planFeatureLabel,
  planPeriodLabel,
} from './profileTheme';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80';

const FEATURES = [
  { icon: 'paw' as const, label: 'Unlimited Pets' },
  { icon: 'people' as const, label: 'Family Sharing' },
  { icon: 'stats-chart' as const, label: 'Pro Stats' },
];

export function PremiumHubContent() {
  const router = useRouter();
  const { token, user, setSession } = useAuth();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const loadPlans = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [planList, status] = await Promise.all([
        fetchPremiumPlans(token),
        fetchPremiumStatus(token),
      ]);
      setPlans(planList);
      setIsPremium(status.isPremium);
      if (planList.length > 0) {
        const yearly = planList.find((p) => p.planId === 'yearly');
        setSelectedPlanId(yearly?.planId ?? planList[0].planId);
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
  const familyPlan = plans.find((p) => p.planId === 'family_hub');

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
      Alert.alert('Welcome to Premium', 'Your subscription is now active.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
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
      <Image source={{ uri: HERO_IMAGE }} style={styles.hero} contentFit="cover" />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <ProfileScreenHeader title="" onBack={() => router.back()} />
      </SafeAreaView>

      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
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
            <ActivityIndicator color={ProfileTheme.green} style={styles.loader} />
          ) : (
            <>
              <View style={styles.planRow}>
                {renderPlanCard(monthlyPlan)}
                {renderPlanCard(yearlyPlan, true)}
              </View>

              {familyPlan ? (
                <TouchableOpacity
                  style={[styles.familyCard, selectedPlanId === familyPlan.planId && styles.familySelected]}
                  onPress={() => setSelectedPlanId(familyPlan.planId)}
                  activeOpacity={0.9}
                >
                  <View>
                    <AppText variant="body" weight="700" color={ProfileTheme.text}>
                      Family Plan
                    </AppText>
                    <AppText variant="caption" color={ProfileTheme.textMuted}>
                      {planFeatureLabel(familyPlan.planId)}
                    </AppText>
                  </View>
                  <AppText variant="body" weight="800" color={ProfileTheme.green}>
                    {formatPlanPrice(familyPlan.price)}
                    {planPeriodLabel(familyPlan.planId, familyPlan.periodDays)}
                  </AppText>
                </TouchableOpacity>
              ) : null}

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

          <AppText variant="caption" color={ProfileTheme.textMuted} style={styles.disclaimer}>
            Cancel anytime. Terms & Privacy apply.
          </AppText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  hero: {
    ...StyleSheet.absoluteFillObject,
    height: '48%',
  },
  safeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    flex: 1,
    marginTop: '38%',
    backgroundColor: ProfileTheme.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  kicker: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  loader: {
    marginVertical: 24,
  },
  planRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ProfileTheme.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: ProfileTheme.border,
    marginBottom: 20,
  },
  familySelected: {
    borderColor: ProfileTheme.green,
    backgroundColor: '#F1FAF1',
  },
  banner: {
    marginBottom: 12,
  },
  ctaBtn: {
    width: '100%',
    borderRadius: 999,
    minHeight: 52,
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    textAlign: 'center',
  },
});
