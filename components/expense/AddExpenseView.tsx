import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { SectionLabel, SheetColors } from '../sheets/sheetUi';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from './expenseData';
import { ExpenseCategoryChips } from './ExpenseCategoryChips';

const inputShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  android: { elevation: 2 },
});

const TAB_BAR_CLEARANCE = 88;

interface AddExpenseViewProps {
  onClose?: () => void;
  onJournalPress?: () => void;
  /** Extra bottom padding when shown inside the tab navigator (floating tab bar). */
  embeddedInTabs?: boolean;
}

export function AddExpenseView({
  onClose,
  onJournalPress,
  embeddedInTabs = false,
}: AddExpenseViewProps) {
  const insets = useSafeAreaInsets();
  const footerPadding =
    Math.max(insets.bottom, Spacing.md) + (embeddedInTabs ? TAB_BAR_CLEARANCE : 0);
  const scrollBottomPadding = embeddedInTabs ? TAB_BAR_CLEARANCE : Spacing.lg;
  const [category, setCategory] = useState<ExpenseCategory>('Vet');
  const [amount, setAmount] = useState('20');
  const [merchant, setMerchant] = useState('Abxb');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onClose?.();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <AppText variant="h3" weight="800" color={SheetColors.title} style={styles.headerTitle}>
            Add Expense
          </AppText>
          {onJournalPress ? (
            <TouchableOpacity
              onPress={onJournalPress}
              hitSlop={12}
              style={styles.headerActionBtn}
              accessibilityLabel="Open pet journal"
            >
              <MaterialCommunityIcons
                name="notebook-outline"
                size={22}
                color={HomeTheme.text}
              />
            </TouchableOpacity>
          ) : onClose ? (
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={styles.headerActionBtn}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={SheetColors.chipText} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.headerDivider} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SectionLabel text="CATEGORY" />
          <ExpenseCategoryChips
            categories={EXPENSE_CATEGORIES}
            selected={category}
            onSelect={setCategory}
          />

          <SectionLabel text="AMOUNT" />
          <View style={[styles.amountField, inputShadow]}>
            <AppText variant="h2" weight="800" color={HomeTheme.green} style={styles.currency}>
              $
            </AppText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={SheetColors.placeholder}
            />
          </View>

          <SectionLabel text="MERCHANT" />
          <View style={[styles.merchantField, inputShadow]}>
            <TextInput
              value={merchant}
              onChangeText={setMerchant}
              style={styles.merchantInput}
              placeholder="Store or vendor name"
              placeholderTextColor={SheetColors.placeholder}
            />
            <MaterialCommunityIcons
              name="storefront-outline"
              size={22}
              color={SheetColors.placeholder}
            />
          </View>

          <SectionLabel text="NOTE (OPTIONAL)" />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a quick note..."
            placeholderTextColor={SheetColors.placeholder}
            style={styles.noteInput}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPadding }]}>
          <AppButton
            title="Add Expense"
            onPress={handleSubmit}
            variant="success"
            size="lg"
            style={styles.submitBtn}
            textStyle={styles.submitText}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: SheetColors.sheetBg,
  },
  container: {
    flex: 1,
    backgroundColor: SheetColors.sheetBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: HomeTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SheetColors.border,
    marginHorizontal: Spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 18 : 14,
    marginBottom: Spacing.md,
  },
  currency: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: SheetColors.inputText,
    padding: 0,
  },
  merchantField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...inputShadow,
  },
  merchantInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: SheetColors.inputText,
    padding: 0,
  },
  noteInput: {
    backgroundColor: SheetColors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 100,
    fontSize: 14,
    fontWeight: '500',
    color: SheetColors.inputText,
    marginBottom: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SheetColors.border,
    backgroundColor: SheetColors.sheetBg,
  },
  submitBtn: {
    borderRadius: Radius.xl,
    width: '100%',
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
