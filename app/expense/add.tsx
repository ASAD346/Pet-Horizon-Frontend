import React from 'react';
import { useRouter } from 'expo-router';
import { AddExpenseView } from '@/components/expense';

export default function AddExpenseScreen() {
  const router = useRouter();

  return <AddExpenseView onClose={() => router.back()} />;
}
