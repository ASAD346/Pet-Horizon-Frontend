import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { HomeTheme } from '@/constants/theme';
import { TAB_BAR_HEIGHT, TAB_BAR_SIDE_MARGIN, getTabBarMetrics } from '@/lib/layout/tabBarMetrics';

const TAB_SLOT_SIZE = 44;
const TAB_ICON_SIZE = 22;
const TAB_INACTIVE_ICON_SIZE = 24;

type TabIconProps = {
  focused: boolean;
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
};

function TabIcon({ focused, activeIcon, inactiveIcon }: TabIconProps) {
  return (
    <View style={styles.tabSlot}>
      <Ionicons
        name={focused ? activeIcon : inactiveIcon}
        size={24}
        color={focused ? '#2E7D32' : '#94A3B8'}
      />
      {focused ? <View style={styles.activeDot} /> : null}
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
        bottom: 0,
        height,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom,
      },
    ],
    [height, insets.bottom],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarLabel: () => null,
        tabBarStyle,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabelStyle: styles.tabBarLabel,
        lazy: false,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tabBarItem: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    marginVertical: 0,
    minWidth: 0,
  },
  tabBarIcon: {
    marginTop: 0,
    marginBottom: 0,
  },
  tabBarLabel: {
    height: 0,
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  },
  tabSlot: {
    width: TAB_SLOT_SIZE,
    height: TAB_SLOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2E7D32',
    marginTop: 4,
    position: 'absolute',
    bottom: 2,
  },
});
