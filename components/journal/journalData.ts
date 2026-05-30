export type JournalCategory = 'all' | 'food' | 'medicine' | 'grooming' | 'walk';

export type TimelineEventStatus = 'scheduled' | 'completed';

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  status: TimelineEventStatus;
  category: Exclude<JournalCategory, 'all'>;
  materialIcon: 'silverware-fork-knife' | 'walk' | 'pill' | 'content-cut';
};

export const JOURNAL_MONTH_LABEL = 'November 2023';

export const JOURNAL_DATES = [
  { id: '1', day: 'Thu', date: 1 },
  { id: '2', day: 'Fri', date: 2 },
  { id: '3', day: 'Sat', date: 3 },
  { id: '4', day: 'Sun', date: 4 },
  { id: '5', day: 'Mon', date: 5 },
  { id: '6', day: 'Tue', date: 6 },
  { id: '7', day: 'Wed', date: 7 },
] as const;

export const JOURNAL_CATEGORY_CHIPS: { id: JournalCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'grooming', label: 'Grooming' },
];

export const JOURNAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    time: '06:30 PM',
    title: 'Evening Dinner',
    status: 'scheduled',
    category: 'food',
    materialIcon: 'silverware-fork-knife',
  },
  {
    id: '2',
    time: '02:00 PM',
    title: 'Afternoon Walk',
    status: 'scheduled',
    category: 'walk',
    materialIcon: 'walk',
  },
  {
    id: '3',
    time: '10:30 AM',
    title: 'Heartgard Medicine',
    status: 'scheduled',
    category: 'medicine',
    materialIcon: 'pill',
  },
  {
    id: '4',
    time: '08:05 AM',
    title: 'Breakfast',
    status: 'completed',
    category: 'food',
    materialIcon: 'silverware-fork-knife',
  },
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
    default:
      return { color: '#757575', bg: '#F0F0F0' };
  }
}
