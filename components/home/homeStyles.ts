import { Platform, StyleSheet } from 'react-native';

export const homeCardShadow = Platform.select({
  ios: {
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  android: {
    elevation: 0, // Flat card style
  },
});

export const homePillCard = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    marginTop: 2,
    marginHorizontal: 4, // prevents clipping by adding horizontal room
    minHeight: 56,
    overflow: 'visible', // ensures borders render completely without clipping
    ...homeCardShadow,
  },
});
