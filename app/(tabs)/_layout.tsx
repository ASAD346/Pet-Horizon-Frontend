import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Text, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useAuth } from '@/hooks/useAuth';
import { ContextGuard } from '@/components/shared/ContextGuard';

type TabConfig = {
  label: string;
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  explore: {
    label: 'Schedule',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  community: {
    label: 'Family',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
  },
  wallet: {
    label: 'Expenses',
    activeIcon: 'cash',
    inactiveIcon: 'cash-outline',
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

function MyCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPremium = user?.premiumStatus === 'premium';

  const activeColor = isPremium ? '#D4A017' : '#2E7D32';
  const inactiveColor = '#94A3B8';
  const barBgColor = isPremium ? '#FFFDF0' : '#FFFFFF';
  const borderColor = isPremium ? 'rgba(212, 160, 23, 0.2)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <View style={[
      styles.tabBarContainer,
      {
        backgroundColor: barBgColor,
        borderColor: borderColor,
        paddingBottom: insets.bottom || 12,
      }
    ]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIGS[route.name] || {
            label: route.name,
            activeIcon: 'help-circle',
            inactiveIcon: 'help-circle-outline',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Center FAB Tab
          if (route.name === 'community') {
            const outerBg = isPremium ? 'rgba(212, 160, 23, 0.12)' : 'rgba(46, 125, 50, 0.12)';
            const innerBg = activeColor;

            return (
              <View key={route.key} style={styles.fabWrapper}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  activeOpacity={0.9}
                  style={[styles.fabOuter, { backgroundColor: outerBg }]}
                >
                  <View style={[styles.fabInner, { backgroundColor: innerBg }]}>
                    <Ionicons
                      name={isFocused ? config.activeIcon : config.inactiveIcon}
                      size={26}
                      color="#FFFFFF"
                    />
                  </View>
                </TouchableOpacity>
                <Text style={[
                  styles.tabLabel,
                  styles.fabLabel,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontWeight: isFocused ? '700' : '500',
                  }
                ]}>
                  {config.label}
                </Text>
              </View>
            );
          }

          // Standard tabs
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isFocused ? config.activeIcon : config.inactiveIcon}
                  size={23}
                  color={isFocused ? activeColor : inactiveColor}
                />
                {isFocused && (
                  <View style={[styles.activeDot, { backgroundColor: activeColor }]} />
                )}
              </View>
              <Text style={[
                styles.tabLabel,
                {
                  color: isFocused ? activeColor : inactiveColor,
                  fontWeight: isFocused ? '700' : '500',
                }
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <ContextGuard>
      <Tabs
        tabBar={(props) => <MyCustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: true,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="community" />
        <Tabs.Screen name="wallet" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </ContextGuard>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  tabBarInner: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.1,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  fabOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -42,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    marginTop: 10,
  },
});
