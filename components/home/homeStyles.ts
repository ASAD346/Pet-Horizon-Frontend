import { Platform, StyleSheet } from 'react-native';

export const homeCardShadow = Platform.select({
  ios: {
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
});

export const homePillCard = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2ECE9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    minHeight: 74,
    ...homeCardShadow,
  },
});
