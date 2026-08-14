import { useAuth } from '@/hooks/useAuth';

export function useAppThemeColor() {
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';
  
  // Vibrant brand green for Free, luxurious dark emerald green for Premium
  const accentColor = isPremium ? '#184F2E' : '#5CB35D';
  const accentBg = isPremium ? '#E1EFE6' : '#F1F8F1';
  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  return {
    isPremium,
    accentColor,
    accentBg,
    gradientColors,
  };
}
