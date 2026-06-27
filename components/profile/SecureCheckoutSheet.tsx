import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { Radius, Spacing } from '@/constants/theme';
import type { PremiumPlan } from '@/types/premium';
import { formatPlanPrice } from './profileTheme';

interface SecureCheckoutSheetProps {
  visible: boolean;
  plan: PremiumPlan | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function SecureCheckoutSheet({
  visible,
  plan,
  onClose,
  onConfirm,
  loading,
  error,
}: SecureCheckoutSheetProps) {
  const insets = useSafeAreaInsets();
  const [cardholder, setCardholder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  // Reset fields when sheet closes
  useEffect(() => {
    if (!visible) {
      setCardholder('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setFocusedField(null);
    }
  }, [visible]);

  const formatCardNumber = (value: string) =>
    value
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const canSubmit =
    cardholder.trim().length >= 2 &&
    cardNumber.replace(/\s/g, '').length >= 15 &&
    expiry.length >= 4 &&
    cvv.length >= 3;

  const handleConfirm = async () => {
    if (!canSubmit || loading) return;
    await onConfirm();
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

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
            {loading ? (
              <View style={styles.headerSpacer} />
            ) : (
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.cancelBtn}>
                <AppText variant="body" weight="600" color="#1E5838">
                  Cancel
                </AppText>
              </TouchableOpacity>
            )}

            <View style={styles.headerCenter}>
              <Ionicons name="shield-checkmark" size={14} color="#1E5838" />
              <AppText variant="h3" weight="800" color="#0A2419" style={styles.headerTitle}>
                Secure Checkout
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
                  colors={['#1A4A2E', '#1E5838']}
                  style={styles.processingIconGradient}
                >
                  <Ionicons name="lock-closed" size={28} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <AppText variant="body" weight="800" color="#0A2419" style={styles.processingTitle}>
                Processing Payment
              </AppText>
              <AppText variant="bodySmall" color="#64748B" style={styles.processingSubtitle}>
                Please wait while we securely activate your subscription…
              </AppText>
              <View style={styles.processingDotsRow}>
                <ActivityIndicator size="small" color="#1E5838" />
                <AppText variant="caption" color="#94A3B8" style={styles.processingDotsText}>
                  This only takes a moment
                </AppText>
              </View>
            </View>
          ) : (
            <>
              {/* ── Plan Summary Banner ──────────────────────────── */}
              {plan ? (
                <View style={styles.summaryBanner}>
                  <View style={styles.summaryLeft}>
                    <View style={styles.summaryIconBox}>
                      <Ionicons name="star" size={14} color="#D4A017" />
                    </View>
                    <View>
                      <AppText variant="bodySmall" weight="800" color="#0A2419">
                        {plan.name} Plan
                      </AppText>
                      <AppText variant="caption" color="#64748B">
                        Pet Horizon Premium
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="body" weight="800" color="#1E5838">
                    {formatPlanPrice(plan.price)}
                  </AppText>
                </View>
              ) : null}

              {/* ── Error Banner ─────────────────────────────────── */}
              {error ? (
                <View style={styles.errorBanner}>
                  <AuthErrorBanner message={error} />
                </View>
              ) : null}

              {/* ── Card Form ────────────────────────────────────── */}
              <View style={styles.form}>
                <SectionLabel text="CARDHOLDER NAME" />
                <TextInput
                  value={cardholder}
                  onChangeText={setCardholder}
                  placeholder="Sarah Johnson"
                  placeholderTextColor={SheetColors.placeholder}
                  style={inputStyle('name')}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />

                <SectionLabel text="CARD NUMBER" />
                <View style={styles.cardRow}>
                  <TextInput
                    value={cardNumber}
                    onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={SheetColors.placeholder}
                    style={[inputStyle('card'), styles.cardInput]}
                    keyboardType="number-pad"
                    maxLength={19}
                    onFocus={() => setFocusedField('card')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Ionicons name="card" size={20} color="#1E5838" style={styles.cardIcon} />
                </View>

                <View style={styles.splitRow}>
                  <View style={styles.splitField}>
                    <SectionLabel text="EXPIRY" />
                    <TextInput
                      value={expiry}
                      onChangeText={(text) => setExpiry(formatExpiry(text))}
                      placeholder="MM/YY"
                      placeholderTextColor={SheetColors.placeholder}
                      style={inputStyle('expiry')}
                      keyboardType="number-pad"
                      maxLength={5}
                      onFocus={() => setFocusedField('expiry')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                  <View style={styles.splitField}>
                    <SectionLabel text="CVV" />
                    <TextInput
                      value={cvv}
                      onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      placeholderTextColor={SheetColors.placeholder}
                      style={inputStyle('cvv')}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={4}
                      onFocus={() => setFocusedField('cvv')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </View>

              {/* ── Submit Button ─────────────────────────────────── */}
              <TouchableOpacity
                style={[styles.payBtn, (!canSubmit || loading) && styles.payBtnDisabled]}
                onPress={handleConfirm}
                disabled={!canSubmit || loading}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={canSubmit ? ['#1A4A2E', '#1E5838'] : ['#94A3B8', '#94A3B8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payBtnGradient}
                >
                  <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.75)" />
                  <AppText variant="body" weight="800" color="#FFFFFF">
                    Authorize & Pay Securely
                  </AppText>
                </LinearGradient>
              </TouchableOpacity>

              {/* ── Security Footer ──────────────────────────────── */}
              <View style={styles.securityFooter}>
                <Ionicons name="shield-checkmark" size={13} color="#94A3B8" />
                <AppText variant="caption" color="#94A3B8" style={styles.securityText}>
                  Secured with bank-grade 256-bit SSL encryption
                </AppText>
              </View>
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
    backgroundColor: SheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 20 },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: Spacing.sm,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cancelBtn: {},
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
  },
  headerSpacer: {
    width: 55,
  },

  // Plan summary banner
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FAF4',
    borderWidth: 1,
    borderColor: '#C4E8D2',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Error
  errorBanner: {
    marginBottom: Spacing.sm,
  },

  // Form
  form: {
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 13,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: Spacing.md,
  },
  inputFocused: {
    borderColor: '#1E5838',
    backgroundColor: '#FAFFFE',
  },
  cardRow: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  cardInput: {
    marginBottom: 0,
    paddingRight: 46,
  },
  cardIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  splitRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  splitField: {
    flex: 1,
  },

  // Pay button
  payBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#1E5838', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: Radius.full,
  },

  // Security footer
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: Spacing.sm,
  },
  securityText: {
    textAlign: 'center',
  },

  // Processing state
  processingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl + 16,
    gap: Spacing.sm,
  },
  processingIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#1E5838', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  processingIconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  processingSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  processingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  processingDotsText: {
    textAlign: 'center',
  },
});
