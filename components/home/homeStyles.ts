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
    paddingVertical: 8.5,
    marginBottom: 6,
    marginTop: 0,
    marginHorizontal: 4, // prevents clipping by adding horizontal room
    minHeight: 52,
    overflow: 'visible', // ensures borders render completely without clipping
    ...homeCardShadow,
  },
});
