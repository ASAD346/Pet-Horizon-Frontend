import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SheetColors } from '../sheets/sheetUi';
import { Radius, Spacing } from '../../constants/theme';
import { API_EXPENSE_CATEGORIES } from '@/lib/expense/expenseMappers';
import { getErrorMessage } from '@/lib/api/errors';
import { createExpense } from '@/services/expense/expenseApi';
import { ExpenseCategoryChips } from './ExpenseCategoryChips';
import { useLocalization } from '@/hooks/useLocalization';
import { FormSheetShell, FormSection, FormSelectInput, SheetOptionPicker } from '../sheets';
import { useToast } from '@/hooks/useToast';

const BRAND_GREEN = '#2E7D32';

import type { ApiExpense } from '@/types/expense';

interface AddExpenseViewProps {
  visible: boolean;
  petId?: string | null;
  token?: string | null;
  onClose: () => void;
  onSaved?: (expense: ApiExpense, budgetStatus?: any) => void;
  isPremium?: boolean;
}

export function AddExpenseView({
  visible,
  petId,
  token,
  onClose,
  onSaved,
  isPremium = false,
}: AddExpenseViewProps) {
  const { currency } = useLocalization();
  const { showToast } = useToast();

  const [category, setCategory] = useState('Food');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to correctly manage focus targets
  const amountRef = useRef<TextInput>(null);
  const merchantRef = useRef<TextInput>(null);

  // Focus tracking for input states
  const [activeField, setActiveField] = useState<'amount' | 'merchant' | 'note' | null>(null);

  const categoryLabels = API_EXPENSE_CATEGORIES.map((item) => item.label);

  const dropdownOptions = React.useMemo(() => {
    return API_EXPENSE_CATEGORIES.map((item) => ({
      value: item.label,
      label: item.label,
    }));
  }, []);

  const handleSubmit = async () => {
    if (saving) return;
    if (!petId || !token) {
      setError('Select a pet before adding an expense.');
      return;
    }
    const value = Number(amount);
    if (!value || Number.isNaN(value) || value <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const selected = API_EXPENSE_CATEGORIES.find((item) => item.label === category);
      const now = new Date();
      // Ensure backend uses the local month by formatting the local time precisely, keeping the local hour/min/sec
      const pad = (n: number) => String(n).padStart(2, '0');
      const localDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.000Z`;
      
      const data = await createExpense(token, {
        petId,
        category: selected?.value ?? 'other',
        amount: value,
        note: [merchant.trim(), note.trim()].filter(Boolean).join(' — ') || undefined,
        date: localDate,
      });
      showToast('Expense added successfully!');
      onSaved?.(data.expense, data.budgetStatus);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      showToast(`Failed to add expense: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title="Add Expense"
      subtitle="Track your pet's spending"
      icon="plus-circle-outline"
      saveLabel="Add Expense"
      onSave={handleSubmit}
      saving={saving}
      saveDisabled={saving || !amount}
      error={error}
      compact
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category */}
        <FormSection title="Category">
          <FormSelectInput
            label=""
            valueLabel={category}
            onPress={() => setPickerVisible(true)}
          />
        </FormSection>

        {/* Amount */}
        <FormSection title="Amount">
          <Pressable 
            onPress={() => amountRef.current?.focus()}
            style={[styles.amountField, activeField === 'amount' && styles.inputActive]}
          >
            <AppText
              variant="h2"
              weight="800"
              color={activeField === 'amount' ? BRAND_GREEN : '#94A3B8'}
              style={styles.currency}
            >
              {currency === 'GBP' ? '£' : '$'}
            </AppText>
            <TextInput
              ref={amountRef}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={SheetColors.placeholder}
              onFocus={() => setActiveField('amount')}
              onBlur={() => setActiveField(null)}
            />
          </Pressable>
        </FormSection>

        {/* Details (Merchant & Notes) */}
        <FormSection title="Details">
          <View style={styles.detailsGroup}>
            <Pressable 
              onPress={() => merchantRef.current?.focus()}
              style={[styles.regularField, activeField === 'merchant' && styles.inputActive]}
            >
              <Ionicons
                name="storefront-outline"
                size={18}
                color={activeField === 'merchant' ? BRAND_GREEN : '#94A3B8'}
              />
              <TextInput
                ref={merchantRef}
                value={merchant}
                onChangeText={setMerchant}
                style={styles.regularInput}
                placeholder="Store or vendor name"
                placeholderTextColor={SheetColors.placeholder}
                onFocus={() => setActiveField('merchant')}
                onBlur={() => setActiveField(null)}
              />
            </Pressable>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add notes (optional)..."
              placeholderTextColor={SheetColors.placeholder}
              style={[styles.noteInput, activeField === 'note' && styles.inputActive]}
              multiline
              textAlignVertical="top"
              onFocus={() => setActiveField('note')}
              onBlur={() => setActiveField(null)}
            />
          </View>
        </FormSection>
      </ScrollView>

      <SheetOptionPicker
        visible={pickerVisible}
        title="Select Category"
        options={dropdownOptions}
        selectedValue={category}
        onClose={() => setPickerVisible(false)}
        onSelect={setCategory}
        useNativeModal={false}
      />
    </FormSheetShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: Spacing.xs,
  },
  currency: {
    fontSize: 24,
    lineHeight: 30,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    padding: 0,
  },
  detailsGroup: {
    gap: Spacing.md,
  },
  regularField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: Spacing.sm,
    minHeight: 44,
  },
  regularInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    padding: 0,
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 80,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  inputActive: {
    borderColor: BRAND_GREEN,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_GREEN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
});
