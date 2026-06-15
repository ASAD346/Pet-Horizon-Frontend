import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { HomeTheme } from '@/constants/theme';
import { TAB_BAR_HEIGHT, TAB_BAR_SIDE_MARGIN, getTabBarMetrics } from '@/lib/layout/tabBarMetrics';

type TabIconProps = {
  focused: boolean;
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
};

function TabIcon({ focused, activeIcon, inactiveIcon }: TabIconProps) {
  return (
    <View style={[styles.tabCircle, focused && styles.tabCircleActive]}>
      <Ionicons
        name={focused ? activeIcon : inactiveIcon}
        size={22}
        color={focused ? HomeTheme.white : HomeTheme.text}
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { bottomOffset, height } = getTabBarMetrics(insets.bottom);

  const tabBarStyle = useMemo(
    () => [
      styles.tabBar,
      {
        bottom: bottomOffset,
        height,
        left: TAB_BAR_SIDE_MARGIN,
        right: TAB_BAR_SIDE_MARGIN,
      },
    ],
    [bottomOffset, height],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="home" inactiveIcon="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="calendar" inactiveIcon="calendar-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Family',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="people" inactiveIcon="people-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="cash" inactiveIcon="cash-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="person" inactiveIcon="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: HomeTheme.surface,
    borderTopWidth: 0,
    paddingTop: 8,
    paddingBottom: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  tabCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: HomeTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCircleActive: {
    backgroundColor: HomeTheme.cardGreen,
  },
});
