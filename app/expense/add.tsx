import React from 'react';
import { useRouter } from 'expo-router';
import { AddExpenseView } from '@/components/expense';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePet } from '@/hooks/useActivePet';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { pet } = useActivePet(token);

  return (
    <AddExpenseView
      petId={pet?._id ?? null}
      token={token}
      onClose={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
