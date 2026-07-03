import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { SheetColors } from '@/components/sheets';
import { Radius, Spacing } from '@/constants/theme';
import type { PremiumPlan } from '@/types/premium';
import { formatPlanPrice } from './profileTheme';

interface SecureCheckoutSheetProps {
  visible: boolean;
  plan: PremiumPlan | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function SecureCheckoutSheet({
  visible,
  plan,
  onClose,
  onConfirm,
  loading,
}: SecureCheckoutSheetProps) {
  const insets = useSafeAreaInsets();

  // Processing animation
  const processingPulse = useRef(new Animated.Value(1)).current;
  const processingLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (loading) {
      processingLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(processingPulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(processingPulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ]),
      );
      processingLoop.current.start();
    } else {
      processingLoop.current?.stop();
      processingPulse.setValue(1);
    }
  }, [loading]);

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
  };

  const displayPriceText = plan?.planId === 'yearly' ? '$49.99/year' : '$4.99/month';
  const displayPeriodText = plan?.planId === 'yearly' ? 'Yearly' : 'Monthly';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={loading ? undefined : onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* ── Header ───────────────────────────────────────────── */}
          <View style={styles.header}>
            {!loading && (
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.cancelBtn}>
                <Ionicons name="close" size={22} color="#5F6368" />
              </TouchableOpacity>
            )}

            <View style={styles.headerCenter}>
              <Ionicons name="logo-google-playstore" size={16} color="#00A152" style={{ marginRight: 6 }} />
              <AppText variant="bodySmall" weight="800" color="#5F6368" style={styles.headerTitle}>
                Google Play Billing
              </AppText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          {/* ── Processing State ─────────────────────────────────── */}
          {loading ? (
            <View style={styles.processingContainer}>
              <Animated.View
                style={[
                  styles.processingIconRing,
                  { transform: [{ scale: processingPulse }] },
                ]}
              >
                <LinearGradient
                  colors={['#00A152', '#00793F']}
                  style={styles.processingIconGradient}
                >
                  <Ionicons name="logo-google-playstore" size={28} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <AppText variant="body" weight="800" color="#202124" style={styles.processingTitle}>
                Contacting Google Play…
              </AppText>
              <AppText variant="bodySmall" color="#5F6368" style={styles.processingSubtitle}>
                Processing your subscription securely. Do not close the app.
              </AppText>
              <View style={styles.processingDotsRow}>
                <ActivityIndicator size="small" color="#00A152" />
              </View>
            </View>
          ) : (
            <>
              {/* ── Google Play Purchase details ──────────────────── */}
              <View style={styles.playPurchaseInfo}>
                <View style={styles.appIconAndTitle}>
                  <View style={styles.appIconBg}>
                    <Ionicons name="paw" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.titleWrapper}>
                    <AppText variant="body" weight="800" color="#202124">
                      PetHorizon Premium ({displayPeriodText})
                    </AppText>
                    <AppText variant="caption" color="#5F6368">
                      PetHorizon
                    </AppText>
                  </View>
                </View>

                <View style={styles.pricingSummaryRow}>
                  <View>
                    <AppText variant="bodySmall" weight="800" color="#202124">
                      {displayPriceText} + tax
                    </AppText>
                    <AppText variant="caption" color="#5F6368" style={styles.renewNote}>
                      Auto-renews every {plan?.planId === 'yearly' ? 'year' : 'month'}. Cancel anytime.
                    </AppText>
                  </View>
                  <AppText variant="body" weight="800" color="#00A152">
                    {plan ? formatPlanPrice(plan.price) : ''}
                  </AppText>
                </View>
              </View>

              <View style={styles.divider} />

              {/* ── Google Play Payment Method selector ────────────── */}
              <View style={styles.gpayMethodRow}>
                <View style={styles.gpayLabelWrapper}>
                  <MaterialCommunityIcons name="google" size={16} color="#5F6368" style={{ marginRight: 4 }} />
                  <AppText variant="caption" weight="800" color="#202124">GPay</AppText>
                </View>
                <View style={styles.cardDetailsWrapper}>
                  <Ionicons name="card" size={14} color="#5F6368" style={{ marginRight: 6 }} />
                  <AppText variant="caption" color="#202124" weight="700">Visa •••• 9876</AppText>
                  <Ionicons name="chevron-forward" size={14} color="#5F6368" style={{ marginLeft: 6 }} />
                </View>
              </View>

              <View style={styles.divider} />

              <AppText variant="caption" color="#5F6368" style={styles.playDisclaimer}>
                By clicking "Subscribe", you authorize Google Play to charge your selected payment method recurringly. You can cancel at any time under Subscriptions in Google Play Store settings.
              </AppText>

              {/* ── Subscribe Button ─────────────────────────────────── */}
              <TouchableOpacity
                style={styles.payBtn}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#00A152', '#008744']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payBtnGradient}
                >
                  <AppText variant="body" weight="800" color="#FFFFFF" style={styles.payBtnText}>
                    Subscribe
                  </AppText>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 12 },
    }),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8EAED',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginBottom: Spacing.sm,
  },
  cancelBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    color: '#5F6368',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 24,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  processingIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 161, 82, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  processingIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  processingSubtitle: {
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: Spacing.lg,
  },
  processingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playPurchaseInfo: {
    paddingVertical: Spacing.sm,
  },
  appIconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1E5838',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  titleWrapper: {
    flex: 1,
  },
  pricingSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  renewNote: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EAED',
    marginVertical: Spacing.sm,
  },
  gpayMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  gpayLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDetailsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playDisclaimer: {
    fontSize: 10,
    lineHeight: 14,
    color: '#80868B',
    marginVertical: Spacing.md,
  },
  payBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  payBtnGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
