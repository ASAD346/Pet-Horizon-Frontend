import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { SheetColors } from '../sheets/sheetUi';
import { Radius, Spacing } from '../../constants/theme';
import { API_EXPENSE_CATEGORIES } from '@/lib/expense/expenseMappers';
import { getErrorMessage } from '@/lib/api/errors';
import { createExpense } from '@/services/expense/expenseApi';
import { ExpenseCategoryChips } from './ExpenseCategoryChips';
import { useLocalization } from '@/hooks/useLocalization';
import { FormSheetShell, FormSection, SheetOptionPicker } from '../sheets';
import { useToast } from '@/hooks/useToast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Skeleton } from '@/components/ui/Skeleton';

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

  const { canEdit, loading: permissionsLoading } = usePermissionGuard(petId, 'expenses');
  const resolvedReadOnly = !canEdit;

  const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    GBP: '£',
    CAD: '$',
    AUD: '$',
  };
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const [category, setCategory] = useState<string | null>(null);
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

  const dropdownOptions = React.useMemo(() => {
    const CATEGORY_META: Record<string, { mciIcon: any; color: string; bg: string; subtitle: string }> = {
      food:        { mciIcon: 'silverware-fork-knife', color: '#5CB35D', bg: '#E8F5E9', subtitle: 'Meals, treats, and pet food' },
      vet:         { mciIcon: 'medical-bag',           color: '#5B9BD5', bg: '#E3F2FD', subtitle: 'Doctor visits and checkups' },
      grooming:    { mciIcon: 'content-cut',           color: '#9C27B0', bg: '#F3E5F5', subtitle: 'Baths, trims, and clipping' },
      medicine:    { mciIcon: 'pill',                  color: '#FF9800', bg: '#FFF3E0', subtitle: 'Prescriptions and supplements' },
      accessories: { mciIcon: 'tag-heart',             color: '#E91E63', bg: '#FCE4EC', subtitle: 'Toys, collars, and leashes' },
      training:    { mciIcon: 'school',                color: '#3F51B5', bg: '#E8EAF6', subtitle: 'Classes and behavior coaching' },
      boarding:    { mciIcon: 'home-heart',            color: '#009688', bg: '#E0F2F1', subtitle: 'Pet sitting and daycare' },
      other:       { mciIcon: 'dots-horizontal',       color: '#607D8B', bg: '#ECEFF1', subtitle: 'Miscellaneous expenses' },
    };
    return API_EXPENSE_CATEGORIES.map((item) => ({
      value: item.value,
      label: item.label,
      ...CATEGORY_META[item.value],
    }));
  }, []);

  const handleSubmit = async () => {
    if (!canEdit) {
      showToast("Read-only access: You cannot modify this entry.");
      return;
    }
    if (saving || resolvedReadOnly) return;
    if (!petId || !token) {
      setError('Select a pet before adding an expense.');
      return;
    }
    if (!category) {
      setError('Select a category.');
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
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const localDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      
      const data = await createExpense(token, {
        petId,
        category: category ?? 'other',
        amount: value,
        note: [merchant.trim(), note.trim()].filter(Boolean).join(' — ') || undefined,
        date: localDate,
      });
      showToast('Expense added successfully!');
      
      // Reset state on successful submission
      setAmount('');
      setMerchant('');
      setNote('');
      setCategory(null);
      setError(null);

      onSaved?.(data.expense, data.budgetStatus);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      showToast(`Failed to add expense: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (!visible) {
      setAmount('');
      setMerchant('');
      setNote('');
      setCategory(null);
      setError(null);
    }
    return () => {
      setAmount('');
      setMerchant('');
      setNote('');
      setCategory(null);
      setError(null);
    };
  }, [visible]);

  if (permissionsLoading) {
    return (
      <FormSheetShell
        visible={visible}
        onClose={onClose}
        title="Add Expense"
        subtitle="Track your pet's spending"
        icon="plus-circle-outline"
        saveLabel={undefined}
        onSave={undefined}
        saving={false}
        error={null}
        isReadOnly={true}
        compact
      >
        <View style={{ padding: 16, gap: 16 }}>
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={48} borderRadius={8} />
          <Skeleton width="30%" height={16} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={48} borderRadius={8} />
        </View>
      </FormSheetShell>
    );
  }

  return (
    <FormSheetShell
      visible={visible}
      onClose={onClose}
      title="Add Expense"
      subtitle="Track your pet's spending"
      icon="plus-circle-outline"
      saveLabel={resolvedReadOnly ? undefined : "Add Expense"}
      onSave={handleSubmit}
      saving={saving}
      saveDisabled={saving || !amount || resolvedReadOnly}
      error={error}
      isReadOnly={resolvedReadOnly}
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
          {(() => {
            const meta = category ? dropdownOptions.find((o) => o.value === category) : null;
            return (
              <Pressable
                onPress={() => setPickerVisible(true)}
                style={[
                  styles.categoryTrigger,
                  meta && { borderColor: meta.color ?? '#E2E8F0' },
                ]}
              >
                {/* Icon badge */}
                <View style={[styles.catIconBadge, { backgroundColor: meta?.bg ?? '#F3F4F6' }]}>
                  {meta?.mciIcon ? (
                    <MaterialCommunityIcons
                      name={meta.mciIcon as any}
                      size={18}
                      color={meta?.color ?? '#9CA3AF'}
                    />
                  ) : (
                    <Ionicons name="grid-outline" size={18} color="#9CA3AF" />
                  )}
                </View>

                {/* Label */}
                <AppText
                  variant="bodySmall"
                  weight="600"
                  color={meta ? (meta.color ?? '#1A1A1A') : '#9CA3AF'}
                  style={{ flex: 1 }}
                >
                  {meta ? meta.label : 'Select a category'}
                </AppText>

                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </Pressable>
            );
          })()}
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
              {currencySymbol}
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
              editable={!resolvedReadOnly}
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
                editable={!resolvedReadOnly}
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
              editable={!resolvedReadOnly}
            />
          </View>
        </FormSection>
      </ScrollView>

      <SheetOptionPicker
        visible={pickerVisible}
        title="Select Category"
        options={dropdownOptions}
        selectedValue={category || ''}
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
  categoryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 10,
    minHeight: 48,
  },
  catIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
