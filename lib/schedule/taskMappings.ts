export const TaskMappings: Record<string, string> = {
  // Feeding types
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
  morning_feed: 'Morning Meal',
  evening_feed: 'Evening Meal',
  afternoon_snack: 'Afternoon Snack',
  night_feed: 'Night Meal',
  automatic_feeder: 'Auto Feeder',

  // Walk times
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',

  // Grooming types
  bath: 'Bath',
  nail_trim: 'Nail Trim',
  nail_trimming: 'Nail Trim',
  haircut: 'Haircut',
  ear_cleaning: 'Ear Cleaning',
  brushing: 'Brushing',
  wing_trim: 'Wing Trim',
  teeth_brushing: 'Teeth Brushing',

  // Categories / Fallbacks
  feeding: 'Feeding',
  walk: 'Walk',
  medicine: 'Medicine',
  grooming: 'Grooming',
  vaccination: 'Vaccination',
};

/**
 * Returns a user-friendly display name for a backend task / schedule key.
 */
export function getTaskDisplayName(backendKey: string): string {
  if (!backendKey) return '';
  const key = backendKey.toLowerCase().trim();
  if (TaskMappings[key]) {
    return TaskMappings[key];
  }
  // Fallback: title-case the string and replace underscores with spaces
  return backendKey
    .replace(/_/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
