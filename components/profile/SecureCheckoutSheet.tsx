import React, { useState } from 'react';
import {
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
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { SectionLabel, SheetColors } from '@/components/sheets';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <AppText variant="body" weight="600" color="#1E5838">
                Cancel
              </AppText>
            </TouchableOpacity>
            <AppText variant="h3" weight="800" color={SheetColors.title}>
              Secure Checkout
            </AppText>
            <View style={styles.headerSpacer} />
          </View>

          {plan ? (
            <View style={styles.summaryContainer}>
              <AppText variant="bodySmall" weight="800" color="#0F3E26" style={styles.planSummary}>
                {plan.name} Plan
              </AppText>
              <AppText variant="bodySmall" weight="800" color="#0F3E26">
                {formatPlanPrice(plan.price)}
              </AppText>
            </View>
          ) : null}

          {error ? (
            <View style={styles.banner}>
              <AuthErrorBanner message={error} />
            </View>
          ) : null}

          <View style={styles.form}>
            <SectionLabel text="CARDHOLDER NAME" />
            <TextInput
              value={cardholder}
              onChangeText={setCardholder}
              placeholder="Sarah Johnson"
              placeholderTextColor={SheetColors.placeholder}
              style={styles.input}
              autoCapitalize="words"
            />

            <SectionLabel text="CARD NUMBER" />
            <View style={styles.cardRow}>
              <TextInput
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={SheetColors.placeholder}
                style={[styles.input, styles.cardInput]}
                keyboardType="number-pad"
                maxLength={19}
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
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={styles.splitField}>
                <SectionLabel text="CVV" />
                <TextInput
                  value={cvv}
                  onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  placeholderTextColor={SheetColors.placeholder}
                  style={styles.input}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          <AppButton
            title="Authorize & Pay Securely"
            onPress={handleConfirm}
            loading={loading}
            disabled={!canSubmit || loading}
            variant="primary"
            size="md"
            style={styles.payBtn}
            textStyle={styles.payBtnText}
          />

          <View style={styles.securityFooter}>
            <Ionicons name="lock-closed" size={12} color={HomeTheme.textMuted} />
            <AppText variant="caption" color={HomeTheme.textMuted} style={styles.footer}>
              Secured with bank-grade 256-bit SSL encryption
            </AppText>
          </View>
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
    backgroundColor: SheetColors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerSpacer: {
    width: 50,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F0FAF3',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
  },
  planSummary: {
    fontWeight: '800',
  },
  banner: {
    marginBottom: Spacing.sm,
  },
  form: {
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: SheetColors.inputBg,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 14,
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  cardRow: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  cardInput: {
    marginBottom: 0,
    paddingRight: 44,
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
  payBtn: {
    width: '100%',
    backgroundColor: '#1E5838',
    borderColor: '#1E5838',
    borderRadius: Radius.lg,
    minHeight: 52,
    marginBottom: Spacing.md,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  footer: {
    textAlign: 'center',
  },
});
