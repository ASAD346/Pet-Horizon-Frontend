import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import * as Application from 'expo-application';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { AppConfirmModal } from '@/components/ui/AppConfirmModal';
import { AppText } from '@/components/ui/AppText';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme, formatPlanPrice } from '@/components/profile/profileTheme';
import { Radius, Spacing } from '@/constants/theme';
import { SkeletonBillingHistory } from '@/components/ui/skeletons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api/errors';
import {
  cancelPremium,
  fetchPaymentInvoices,
} from '@/services/premium/premiumApi';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  restorePurchases,
} from 'expo-iap';
import type { PaymentInvoice, PremiumStatusResponse } from '@/types/premium';

const PREMIUM_PERKS = [
  {
    title: 'Unlimited Pet Profiles',
    description: 'Register all your pets and switch between profiles with a single tap.',
    icon: 'paw',
  },
  {
    title: 'Expanded Photo Journal',
    description: 'Capture daily memories and store high-resolution pet photo galleries.',
    icon: 'camera-outline',
  },
  {
    title: 'Family & Caregiver Circle',
    description: 'Invite family members, assign care chores, and sync daily routines.',
    icon: 'account-group-outline',
  },
  {
    title: 'Priority Smart Reminders',
    description: 'Custom alerts for meals, medications, walks, and vet appointments.',
    icon: 'bell-ring-outline',
  },
];

function PremiumPerksCard() {
  return (
    <View style={styles.perksCard}>
      <View style={styles.perksHeader}>
        <View style={styles.perksHeaderIcon}>
          <MaterialCommunityIcons name="crown" size={16} color="#D4A017" />
        </View>
        <AppText variant="bodySmall" weight="800" color="#0F172A" style={styles.perksTitle}>
          WHAT'S INCLUDED IN PREMIUM
        </AppText>
      </View>

      <View style={styles.perksList}>
        {PREMIUM_PERKS.map((perk, index) => (
          <View key={index} style={styles.perkRow}>
            <View style={styles.perkIconCircle}>
              <MaterialCommunityIcons name={perk.icon as any} size={15} color="#184F2E" />
            </View>
            <View style={styles.perkContent}>
              <AppText variant="bodySmall" weight="700" color="#0F172A">
                {perk.title}
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.perkDesc}>
                {perk.description}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

interface PlanOptionCardProps {
  title: string;
  price: string;
  period: string;
  subPrice?: string;
  badge?: string;
  selected: boolean;
  isCurrentActive?: boolean;
  onSelect: () => void;
}

function PlanOptionCard({
  title,
  price,
  period,
  subPrice,
  badge,
  selected,
  isCurrentActive = false,
  onSelect,
}: PlanOptionCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.selectorCard,
        selected && styles.selectorCardSelected,
        isCurrentActive && styles.selectorCardActive,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.radioInnerDot} />}
      </View>

      <View style={styles.selectorCenter}>
        <View style={styles.selectorTitleRow}>
          <AppText variant="body" weight="800" color={selected ? '#0F172A' : '#334155'}>
            {title}
          </AppText>
          {badge && (
            <View style={styles.savingsBadge}>
              <AppText variant="caption" weight="800" color="#166534" style={{ fontSize: 9 }}>
                {badge}
              </AppText>
            </View>
          )}
          {isCurrentActive && (
            <View style={styles.currentActiveBadge}>
              <AppText variant="caption" weight="800" color="#2E7D32" style={{ fontSize: 9 }}>
                CURRENT
              </AppText>
            </View>
          )}
        </View>
        {subPrice && (
          <AppText variant="caption" color="#64748B" style={{ marginTop: 2 }}>
            {subPrice}
          </AppText>
        )}
      </View>

      <View style={styles.selectorRight}>
        <AppText variant="h3" weight="800" color="#0F172A">
          {price}
        </AppText>
        <AppText variant="caption" color="#64748B" style={{ fontSize: 11 }}>
          {period}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

function InvoiceRow({ invoice, isLast }: { invoice: PaymentInvoice; isLast?: boolean }) {
  const statusColor =
    invoice.status === 'paid' ? '#10B981' :
    invoice.status === 'pending' ? '#F59E0B' : '#EF4444';

  const statusBg =
    invoice.status === 'paid' ? '#E6FBF3' :
    invoice.status === 'pending' ? '#FFFBEB' : '#FEF2F2';

  return (
    <View style={[styles.invoiceRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.invoiceLeftContainer}>
        <View style={styles.invoiceIconContainer}>
          <Ionicons name="receipt-outline" size={18} color="#1E5838" />
        </View>
        <View style={styles.invoiceLeft}>
          <AppText variant="bodySmall" weight="700" color="#1E293B">
            #{invoice.id.slice(-6).toUpperCase()}
          </AppText>
          <AppText variant="caption" color="#64748B" style={{ fontSize: 11 }}>
            {invoice.date}
          </AppText>
        </View>
      </View>
      <View style={styles.invoiceRight}>
        <AppText variant="bodySmall" weight="800" color="#0F172A">
          {formatPlanPrice(invoice.amount)}
        </AppText>
        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <AppText variant="caption" weight="800" color={statusColor} style={{ fontSize: 9 }}>
            {invoice.status.toUpperCase()}
          </AppText>
        </View>
      </View>
    </View>
  );
}

export default function BillingScreen() {
  const router = useDebouncedRouter();
  const { token, user } = useAuth();
  const isFocused = useIsFocused();
  const { premiumStatus: status, isPremium, refetch: refetchPremium } = usePremiumStatus();
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { showToast, showErrorToast } = useToast();

  const isFocusedRef = React.useRef(isFocused);
  React.useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [livePlans, setLivePlans] = useState<any[]>([]);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [, invoiceList] = await Promise.all([
        refetchPremium(),
        fetchPaymentInvoices(token),
      ]);
      setInvoices(invoiceList);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, refetchPremium]);

  useEffect(() => { reload(); }, [reload]);

  const selectedPlanRef = React.useRef<'monthly' | 'yearly'>('yearly');
  const [restoring, setRestoring] = useState(false);

  const checkAndRestoreExistingPurchase = useCallback(async (silent = true) => {
    console.log('[IAP Diagnostics] Checking existing purchases...');
    try {
      await initConnection();
      const purchases = await getAvailablePurchases();
      console.log('[IAP Diagnostics] Existing purchases:', JSON.stringify(purchases, null, 2));

      if (purchases && purchases.length > 0) {
        const premiumPurchase: any = purchases.find(
          (p: any) => p.productId === 'pethorizon_premium' && p.purchaseToken
        );

        if (premiumPurchase) {
          console.log('[IAP Diagnostics] Found existing premium purchase:', {
            productId: premiumPurchase.productId,
            purchaseState: premiumPurchase.purchaseStateAndroid || premiumPurchase.purchaseState,
            acknowledged: premiumPurchase.isAcknowledgedAndroid || premiumPurchase.acknowledged,
            purchaseTokenExists: !!premiumPurchase.purchaseToken,
          });

          if (!silent) {
            setCheckoutLoading(true);
          }

          const { verifyGooglePlayPurchase } = require('@/services/premium/premiumApi');
          const verifyRes = await verifyGooglePlayPurchase(token!, {
            productId: premiumPurchase.productId,
            purchaseToken: premiumPurchase.purchaseToken!,
            packageName: Application.applicationId || 'com.anonymous.PetHorizon',
            planId: selectedPlanRef.current,
          });

          console.log('[IAP Diagnostics] Backend verification result:', verifyRes);

          if (verifyRes.success) {
            await finishTransaction({ purchase: premiumPurchase, isConsumable: false });
            if (!silent) {
              showToast('Premium subscription successfully restored!');
            }
            await reload();
            return true;
          }
        }
      }
      if (!silent) {
        showToast('No active premium subscription found to restore.');
      }
    } catch (err: any) {
      console.error('[IAP Diagnostics ERROR] Pre-purchase check / restore failed:', err);
      if (!silent) {
        showToast(getErrorMessage(err, 'Failed to restore purchases. Please verify your Google account setup.'), 'error');
      }
    } finally {
      if (!silent) {
        setCheckoutLoading(false);
      }
    }
    return false;
  }, [token, reload, showToast]);

  useEffect(() => {
    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const setupIapListeners = async () => {
      try {
        await initConnection();
        
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
          if (!isFocusedRef.current) {
            console.log('[IAP] BillingScreen is not focused, skipping purchase verification.');
            return;
          }
          const receipt = purchase.purchaseToken;
          if (receipt) {
            try {
              setCheckoutLoading(true);
              const { verifyGooglePlayPurchase } = require('@/services/premium/premiumApi');
              const verifyRes = await verifyGooglePlayPurchase(token!, {
                productId: purchase.productId,
                purchaseToken: purchase.purchaseToken!,
                packageName: Application.applicationId || 'com.anonymous.PetHorizon',
                planId: selectedPlanRef.current,
              });

              if (verifyRes.success) {
                await finishTransaction({ purchase, isConsumable: false });
                showToast('Successfully subscribed to Premium!');
                await reload();
              } else {
                throw new Error('Verification failed.');
              }
            } catch (err) {
              showToast('Could not verify your purchase with Google Play. Please try again.', 'error');
            } finally {
              setCheckoutLoading(false);
            }
          }
        });

        purchaseErrorSubscription = purchaseErrorListener((error) => {
          console.warn('Google Play purchase error:', error);
          setCheckoutLoading(false);
        });
      } catch (err) {
        console.log('IAP Listener Setup Error:', err);
      }
    };

    const fetchLivePlans = async () => {
      console.log('[IAP Diagnostics] Starting Billing screen plan load...');
      console.log('[IAP Diagnostics] Target Product ID: pethorizon_premium');
      console.log('[IAP Diagnostics] Query Type: subs');
      try {
        console.log('[IAP Diagnostics] Initializing connection to Google Play Store...');
        const connResult = await initConnection();
        console.log('[IAP Diagnostics] Connection initialization result:', connResult);

        console.log('[IAP Diagnostics] Calling fetchProducts with SKU: pethorizon_premium...');
        const products = await fetchProducts({ skus: ['pethorizon_premium'], type: 'subs' });
        console.log('[IAP Diagnostics] fetchProducts succeeded. Result count:', products?.length ?? 0);
        console.log('[IAP Diagnostics] Returned product list details:', JSON.stringify(products, null, 2));

        if (products && products.length > 0) {
          const premiumProduct = products.find(
            (p: any) => p.productId === 'pethorizon_premium' || p.id === 'pethorizon_premium'
          );
          if (premiumProduct) {
            const mapped: any[] = [];
            
            // Map standard subscriptionOffers
            const offers = premiumProduct.subscriptionOffers || [];
            console.log('[IAP Diagnostics] subscriptionOffers count in Billing:', offers.length);
            offers.forEach((offer: any) => {
              const basePlanId = offer.basePlanIdAndroid || offer.basePlanId;
              if (basePlanId === 'monthly' || basePlanId === 'yearly') {
                console.log(`[IAP Diagnostics] Found basePlanId=${basePlanId} in subscriptionOffers`);
                mapped.push({
                  productId: 'pethorizon_premium',
                  basePlanId,
                  offerToken: offer.offerTokenAndroid || offer.offerToken || '',
                });
              }
            });

            // Map legacy subscriptionOfferDetailsAndroid as fallback or supplementary
            if ((premiumProduct as any).subscriptionOfferDetailsAndroid) {
              console.log('[IAP Diagnostics] Processing subscriptionOfferDetailsAndroid count:', (premiumProduct as any).subscriptionOfferDetailsAndroid.length);
              (premiumProduct as any).subscriptionOfferDetailsAndroid.forEach((detail: any) => {
                const basePlanId = detail.basePlanId;
                if (basePlanId === 'monthly' || basePlanId === 'yearly') {
                  // Only add if not already mapped from subscriptionOffers
                  const alreadyMapped = mapped.some((m) => m.basePlanId === basePlanId);
                  if (!alreadyMapped) {
                    console.log(`[IAP Diagnostics] Found basePlanId=${basePlanId} in subscriptionOfferDetailsAndroid (supplementary)`);
                    mapped.push({
                      productId: 'pethorizon_premium',
                      basePlanId,
                      offerToken: detail.offerToken || '',
                    });
                  } else {
                    console.log(`[IAP Diagnostics] basePlanId=${basePlanId} already mapped, skipping subscriptionOfferDetailsAndroid`);
                  }
                }
              });
            }

            console.log('[IAP Diagnostics] Mapped live plans to state:', JSON.stringify(mapped));
            setLivePlans(mapped);
          } else {
            console.warn('[IAP Diagnostics] Product pethorizon_premium not found in query results.');
          }
        } else {
          console.warn('[IAP Diagnostics] Google Play returned no products.');
        }
      } catch (err: any) {
        console.error('[IAP Diagnostics ERROR] Failed to fetch subscriptions from Google Play.');
        console.error('[IAP Diagnostics ERROR] Code:', err?.code || err?.errorCode || 'N/A');
        console.error('[IAP Diagnostics ERROR] Message:', err?.message || err?.message || 'N/A');
        console.error('[IAP Diagnostics ERROR] Full Error Details:', JSON.stringify(err, null, 2));
      }
    };

    if (token) {
      setupIapListeners();
      fetchLivePlans();
      // Step 4: Auto check/restore on screen mount
      checkAndRestoreExistingPurchase(true);
    }

    return () => {
      if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
      if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
      endConnection();
    };
  }, [token, checkAndRestoreExistingPurchase]);

  const handleSelectPlan = async (planId: 'monthly' | 'yearly') => {
    if (isPremium) {
      showToast('You already have an active premium subscription.', 'info');
      return;
    }
    selectedPlanRef.current = planId;
    setCheckoutLoading(true);

    // Step 2 & 9: Pre-purchase check
    console.log('[IAP Diagnostics] Pre-purchase check before requestPurchase...');
    try {
      await initConnection();
      const purchases = await getAvailablePurchases();
      const premiumPurchase = purchases?.find(
        (p: any) => p.productId === 'pethorizon_premium' && p.purchaseToken
      );

      if (premiumPurchase) {
        console.log('[IAP Diagnostics] Pre-purchase check: User already owns subscription. Restoring...');
        const restored = await checkAndRestoreExistingPurchase(false);
        if (restored) {
          setCheckoutLoading(false);
          return;
        }
      }
    } catch (checkErr) {
      console.warn('[IAP Diagnostics] Failed pre-purchase check:', checkErr);
    }

    const matched = livePlans.find((p) => p.basePlanId === planId);
    if (!matched) {
      const errorMsg = `Offer for ${planId} plan could not be loaded. Please try again.`;
      console.error(errorMsg);
      showToast(errorMsg, 'error');
      setCheckoutLoading(false);
      return;
    }
    const offerToken = matched.offerToken || '';
    console.log(`IAP Requesting Purchase: sku: pethorizon_premium, basePlanId: ${planId}, offerToken: ${offerToken}`);
    try {
      await requestPurchase({
        request: {
          google: {
            skus: ['pethorizon_premium'],
            subscriptionOffers: [
              {
                sku: 'pethorizon_premium',
                offerToken,
              }
            ]
          }
        },
        type: 'subs'
      });
    } catch (error: any) {
      console.error('IAP Purchase Launch Failed:', error);
      console.error('IAP Purchase Launch Failed details:', JSON.stringify(error, null, 2));
      
      if (error?.code === 'E_ALREADY_OWNED' || error?.message?.includes('already owned') || error?.code?.includes('already-owned')) {
        Alert.alert(
          'Active Subscription',
          'You already own this subscription. Would you like to restore/sync it now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Restore', onPress: () => checkAndRestoreExistingPurchase(false) }
          ]
        );
      } else {
        showToast('Unable to complete Google Play purchase. Please try again.', 'error');
      }
      setCheckoutLoading(false);
    }
  };

  const handleCancel = () => {
    if (!token) return;
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!token) return;
    setCancelling(true);
    setShowCancelModal(false);
    try {
      const result = await cancelPremium(token);
      showToast(result.message);
      await reload();
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const planKey = status?.plan ?? '';
  const isMonthlyActive = isPremium && planKey !== 'yearly' && planKey !== 'annual';
  const isYearlyActive = isPremium && (planKey === 'yearly' || planKey === 'annual');

  const [selectedPlanTier, setSelectedPlanTier] = useState<'yearly' | 'monthly'>('yearly');

  useEffect(() => {
    if (isMonthlyActive) {
      setSelectedPlanTier('monthly');
    } else if (isYearlyActive) {
      setSelectedPlanTier('yearly');
    }
  }, [isMonthlyActive, isYearlyActive]);

  const renewLabel = status?.expiresAt
    ? `${status.autoRenew ? 'Renews' : 'Expires'} ${new Date(status.expiresAt).toLocaleDateString()}`
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ProfileScreenHeader title="Billing & Subscription" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Active Premium Details Section */}
        {isPremium && status && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall" weight="800" color="#1E293B">
                  Active Subscription
                </AppText>
                <AppText variant="caption" color="#64748B" style={{ fontSize: 11 }}>
                  Premium member benefits unlocked
                </AppText>
              </View>
              <View style={styles.detailsActiveBadge}>
                <AppText variant="caption" weight="800" color="#2E7D32" style={{ fontSize: 9 }}>
                  ACTIVE
                </AppText>
              </View>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">Active Plan</AppText>
                <AppText variant="caption" weight="800" color="#0F172A">
                  {isYearlyActive ? 'Yearly' : 'Monthly'}
                </AppText>
              </View>
              
              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">Status</AppText>
                <AppText variant="caption" weight="800" color="#22C55E">
                  ACTIVE
                </AppText>
              </View>

              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">Billing Cycle</AppText>
                <AppText variant="caption" weight="800" color="#0F172A">
                  {isYearlyActive ? '$49.99/year' : '$4.99/month'}
                </AppText>
              </View>

              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">
                  {status.autoRenew ? 'Next Renewal' : 'Expires On'}
                </AppText>
                <AppText variant="caption" weight="800" color="#0F172A">
                  {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'N/A'}
                </AppText>
              </View>

              <View style={styles.detailsRow}>
                <AppText variant="caption" color="#64748B">Auto-Renew</AppText>
                <AppText variant="caption" weight="800" color={status.autoRenew ? '#22C55E' : '#EF4444'}>
                  {status.autoRenew ? 'Enabled' : 'Disabled'}
                </AppText>
              </View>
            </View>
          </View>
        )}

        <AppText variant="bodySmall" weight="800" color="#64748B" style={styles.sectionTitle}>
          PREMIUM BENEFITS
        </AppText>

        <PremiumPerksCard />

        <AppText variant="bodySmall" weight="800" color="#64748B" style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
          SELECT BILLING CYCLE
        </AppText>

        <View style={styles.selectorContainer}>
          <PlanOptionCard
            title="Yearly Subscription"
            price="$49.99"
            period="/ year"
            subPrice="$4.16 / mo · Billed annually"
            badge="SAVE 17%"
            selected={selectedPlanTier === 'yearly'}
            isCurrentActive={isYearlyActive}
            onSelect={() => setSelectedPlanTier('yearly')}
          />

          <PlanOptionCard
            title="Monthly Subscription"
            price="$4.99"
            period="/ month"
            subPrice="Flexible · Billed monthly"
            selected={selectedPlanTier === 'monthly'}
            isCurrentActive={isMonthlyActive}
            onSelect={() => setSelectedPlanTier('monthly')}
          />
        </View>

        {/* Primary Action Button */}
        {((selectedPlanTier === 'yearly' && isYearlyActive) || (selectedPlanTier === 'monthly' && isMonthlyActive)) ? (
          <View style={styles.currentActivePillContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#166534" />
            <AppText variant="bodySmall" weight="800" color="#166534">
              Your Current Active Plan
            </AppText>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.primarySubscribeButton}
            onPress={() => handleSelectPlan(selectedPlanTier)}
            activeOpacity={0.85}
            disabled={checkoutLoading}
          >
            {checkoutLoading && selectedPlanRef.current === selectedPlanTier ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="crown" size={18} color="#FDE047" />
                <AppText variant="body" weight="800" color="#FFFFFF">
                  {selectedPlanTier === 'yearly'
                    ? 'Subscribe Yearly • $49.99 / yr'
                    : 'Subscribe Monthly • $4.99 / mo'}
                </AppText>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.guaranteeRow}>
          <Ionicons name="shield-checkmark-outline" size={13} color="#64748B" />
          <AppText variant="caption" color="#64748B" style={styles.guaranteeText}>
            Secured via Google Play • Cancel anytime in store settings
          </AppText>
        </View>

        <View style={styles.freeNoticeContainer}>
          <MaterialCommunityIcons name="paw" size={16} color="#64748B" />
          <AppText variant="caption" color="#64748B" style={{ flex: 1, lineHeight: 16 }}>
            Free Plan includes 1 pet profile and essential daily logging forever.
          </AppText>
        </View>

        {isPremium && status?.autoRenew && (
          <TouchableOpacity style={styles.cancelCard} onPress={handleCancel} activeOpacity={0.8} disabled={cancelling}>
            <View style={styles.cancelContent}>
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall" weight="700" color="#EF4444">
                  Cancel Auto-Renewal
                </AppText>
                <AppText variant="caption" color="#94A3B8" style={{ marginTop: 2 }}>
                  Your premium access remains active until the end of your billing cycle.
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreRow}
          onPress={() => checkAndRestoreExistingPurchase(false)}
          activeOpacity={0.7}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <ActivityIndicator size="small" color="#1E5838" />
          ) : (
            <Ionicons name="refresh" size={13} color="#64748B" />
          )}
          <AppText variant="caption" color="#64748B" style={styles.restoreText}>
            {checkoutLoading ? 'Checking purchases…' : 'Restore Purchases'}
          </AppText>
        </TouchableOpacity>

        <View style={styles.infoBanner}>
          <Ionicons name="logo-google-playstore" size={18} color="#64748B" />
          <AppText variant="caption" color="#64748B" style={styles.infoText}>
            Payment methods, invoices, and billing cycles are managed securely via your Google Play Store account settings.
          </AppText>
        </View>

        <AppText variant="bodySmall" weight="800" color="#64748B" style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
          BILLING HISTORY
        </AppText>

        <View style={styles.historyCard}>
          {loading ? (
            <SkeletonBillingHistory count={3} />
          ) : invoices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={28} color="#CBD5E1" style={{ marginBottom: 8 }} />
              <AppText variant="bodySmall" color="#94A3B8">
                No invoices on this account yet
              </AppText>
            </View>
          ) : (
            invoices.map((inv, idx) => (
              <InvoiceRow
                key={inv.id}
                invoice={inv}
                isLast={idx === invoices.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AppConfirmModal
        visible={showCancelModal}
        title="Cancel Auto-Renewal?"
        message="Auto-renew will be turned off. You keep Premium access until the end of your current billing period."
        confirmLabel="Cancel Renewal"
        cancelLabel="Keep Premium"
        variant="warning"
        loading={cancelling}
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelModal(false)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ProfileTheme.background },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  /* Premium Perks Card */
  perksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg || 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  perksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
  },
  perksHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perksTitle: {
    letterSpacing: 0.6,
    fontSize: 12,
  },
  perksList: {
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  perkIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkContent: {
    flex: 1,
  },
  perkDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
    color: '#64748B',
  },

  /* Plan Selector Options */
  selectorContainer: {
    gap: 10,
    marginBottom: Spacing.md,
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md || 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  selectorCardSelected: {
    borderColor: '#184F2E',
    backgroundColor: '#F8FCF9',
  },
  selectorCardActive: {
    borderColor: '#86EFAC',
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
    borderColor: '#184F2E',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#184F2E',
  },
  selectorCenter: {
    flex: 1,
  },
  selectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  savingsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  currentActiveBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  selectorRight: {
    alignItems: 'flex-end',
  },

  /* Actions */
  primarySubscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#184F2E',
    borderRadius: Radius.md || 12,
    paddingVertical: 15,
    paddingHorizontal: Spacing.md,
    marginTop: 4,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#184F2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  currentActivePillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md || 12,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    marginTop: 4,
    gap: 8,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    marginBottom: Spacing.md,
  },
  guaranteeText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  freeNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md || 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.xl,
  },
  /* Subscription Details Card */
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md || 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsActiveBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  detailsGrid: {
    gap: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  /* Cancel Card */
  cancelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    marginBottom: Spacing.lg,
  },
  cancelContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  restoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  restoreText: {
    fontSize: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  invoiceLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoiceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceLeft: {
    gap: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
