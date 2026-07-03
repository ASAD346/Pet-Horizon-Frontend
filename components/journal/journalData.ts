import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type JournalCategory =
  | 'all'
  | 'food'
  | 'walk'
  | 'medicine'
  | 'grooming'
  | 'vaccination'
  | 'general';

export type TimelineEventStatus = 'scheduled' | 'completed' | 'skipped' | 'missed';

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  status: TimelineEventStatus;
  category: Exclude<JournalCategory, 'all'>;
  materialIcon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  imageUrl?: string | null;
};

export const JOURNAL_CATEGORY_CHIPS: { id: JournalCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'walk', label: 'Walks' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'grooming', label: 'Grooming' },
  { id: 'vaccination', label: 'Vaccines' },
];

export function getCategoryStyle(category: TimelineEvent['category']) {
  switch (category) {
    case 'food':
      return { color: '#E57373', bg: '#FFEBEE' };
    case 'walk':
      return { color: '#F5A623', bg: '#FFF8E1' };
    case 'medicine':
      return { color: '#5B9BD5', bg: '#E3F2FD' };
    case 'grooming':
      return { color: '#E91E8C', bg: '#FCE4F0' };
    case 'vaccination':
      return { color: '#673AB7', bg: '#EDE7F6' };
    default:
      return { color: '#757575', bg: '#F0F0F0' };
  }
}
