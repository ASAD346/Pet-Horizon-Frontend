import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AddExpenseView } from '@/components/expense';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { usePetPermissions } from '@/hooks/usePetPermissions';
import { useToast } from '@/hooks/useToast';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { pet } = useActivePet(token);
  const { canEditExpenses } = usePetPermissions(token, pet, user?._id);
  const { showToast } = useToast();

  useEffect(() => {
    if (pet && !canEditExpenses) {
      showToast('You do not have permission to add expenses for this pet.');
      router.back();
    }
  }, [pet, canEditExpenses, router, showToast]);

  if (pet && !canEditExpenses) {
    return null;
  }

  const isPremium = user?.premiumStatus === 'premium';

  return (
    <AddExpenseView
      visible={true}
      petId={pet?._id ?? null}
      token={token}
      isPremium={isPremium}
      onClose={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
