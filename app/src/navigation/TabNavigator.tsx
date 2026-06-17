import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRef } from 'react'

import HomeScreen from '../screens/HomeScreen'
import StatsScreen from '../screens/StatsScreen'
import AssistantScreen from '../screens/AssistantScreen'
import AccountScreen from '../screens/AccountScreen'
import MyBagScreen from '../screens/MyBagScreen'
import SwingThoughtsScreen from '../screens/SwingThoughtsScreen'
import SettingsScreen from '../screens/SettingsScreen'
import AddRoundScreen from '../screens/AddRoundScreen'
import EnterScoresScreen from '../screens/EnterScoresScreen'
import RoundSummaryScreen from '../screens/RoundSummaryScreen'
import HeatmapScreen from '../screens/HeatmapScreen'
import SpiderChartScreen from '../screens/SpiderChartScreen'
import MetricDetailScreen from '../screens/MetricDetailScreen'

import { C, F } from '../theme'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// ─── Play stack ───────────────────────────────────────────────
function PlayStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddRound" component={AddRoundScreen} />
      <Stack.Screen name="EnterScores" component={EnterScoresScreen} />
      <Stack.Screen name="RoundSummary" component={RoundSummaryScreen} />
    </Stack.Navigator>
  )
}

// ─── Stats stack ──────────────────────────────────────────────
function StatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="StatsHome" component={StatsScreen} />
      <Stack.Screen name="Heatmap" component={HeatmapScreen} />
      <Stack.Screen name="SpiderChart" component={SpiderChartScreen} />
      <Stack.Screen name="MetricDetail" component={MetricDetailScreen} />
    </Stack.Navigator>
  )
}

// ─── Me stack ────────────────────────────────────────────────
function MeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="AccountHome" component={AccountScreen} />
      <Stack.Screen name="MyBag" component={MyBagScreen} />
      <Stack.Screen name="SwingThoughts" component={SwingThoughtsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  )
}

// ─── Custom tab bar ───────────────────────────────────────────
const TABS = [
  { name: 'Home',      icon: 'home-outline',      iconActive: 'home' },
  { name: 'Stats',     icon: 'bar-chart-outline',  iconActive: 'bar-chart' },
  { name: 'Caddie',    icon: 'chatbubble-outline', iconActive: 'chatbubble' },
  { name: 'Play',      icon: 'flag-outline',       iconActive: 'flag' },
  { name: 'Me',        icon: 'person-outline',     iconActive: 'person' },
]

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={tb.bar}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index
        const tab = TABS[index]

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={tb.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(isFocused ? tab.iconActive : tab.icon) as any}
              size={22}
              color={isFocused ? C.fairwayDark : C.ink3}
            />
            <Text style={[tb.tabLabel, { color: isFocused ? C.fairwayDark : C.ink3 }]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: C.cardBg,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
    paddingBottom: 24,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  tabLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  },
})

// ─── Root navigator ───────────────────────────────────────────
export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Stats"   component={StatsStack} />
      <Tab.Screen name="Caddie"  component={AssistantScreen} />
      <Tab.Screen name="Play"    component={PlayStack} />
      <Tab.Screen name="Me"      component={MeStack} />
    </Tab.Navigator>
  )
}