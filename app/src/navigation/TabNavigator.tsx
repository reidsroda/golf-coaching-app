import { useRef, useEffect } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, Animated, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import ActivityScreen from '../screens/ActivityScreen'
import AssistantScreen from '../screens/AssistantScreen'
import AccountScreen from '../screens/AccountScreen'
import AddRoundScreen from '../screens/AddRoundScreen'
import EnterScoresScreen from '../screens/EnterScoresScreen'
import RoundSummaryScreen from '../screens/RoundSummaryScreen'

const { width } = Dimensions.get('window')
const TAB_COUNT = 5
const TAB_WIDTH = width / TAB_COUNT
const CENTER_SIZE = 80
const TAB_BAR_HEIGHT = 90
const ICON_SIZE = 24
const LABEL_HEIGHT = 12
const GAP = 4
const CONTENT_HEIGHT = ICON_SIZE + GAP + LABEL_HEIGHT
const HIGHLIGHT_PADDING = 10
const HIGHLIGHT_HEIGHT = CONTENT_HEIGHT + HIGHLIGHT_PADDING * 2
const LABEL_BOTTOM = 8
const HIGHLIGHT_TOP = 0

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function PlayStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddRound" component={AddRoundScreen} />
      <Stack.Screen name="EnterScores" component={EnterScoresScreen} />
      <Stack.Screen name="RoundSummary" component={RoundSummaryScreen} />
    </Stack.Navigator>
    
  )
}

const TABS = [
  { name: 'Home', label: 'Home' },
  { name: 'Activity', label: 'Activity' },
  { name: 'Assistant', label: 'Assistant' },
  { name: 'Play', label: 'Play' },
  { name: 'Account', label: 'Account' },
]

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets()

  const NORMAL_HIGHLIGHT_WIDTH = TAB_WIDTH * 0.84
  const CENTER_HIGHLIGHT_WIDTH = CENTER_SIZE + 4

  const getNormalHighlightX = (index: number) =>
    index * TAB_WIDTH + (TAB_WIDTH - NORMAL_HIGHLIGHT_WIDTH) / 2

  const getCenterHighlightX = () =>
    2 * TAB_WIDTH + (TAB_WIDTH - CENTER_HIGHLIGHT_WIDTH) / 2

  const getHighlightX = (index: number) =>
    index === 2 ? getCenterHighlightX() : getNormalHighlightX(index)

  const getHighlightWidth = (index: number) =>
    index === 2 ? CENTER_HIGHLIGHT_WIDTH : NORMAL_HIGHLIGHT_WIDTH

  const bubbleX = useRef(new Animated.Value(getHighlightX(state.index))).current
  const bubbleWidth = useRef(new Animated.Value(getHighlightWidth(state.index))).current

  useEffect(() => {
    Animated.spring(bubbleX, {
      toValue: getHighlightX(state.index),
      useNativeDriver: false,
      damping: 18,
      stiffness: 180,
      mass: 0.8
    }).start()
    Animated.spring(bubbleWidth, {
      toValue: getHighlightWidth(state.index),
      useNativeDriver: false,
      damping: 18,
      stiffness: 180,
      mass: 0.8
    }).start()
  }, [state.index])

  return (
    <View style={{ backgroundColor: '#000000', overflow: 'visible' }}>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 0 }]}>

        <Animated.View
          style={[
            styles.highlight,
            {
              top: HIGHLIGHT_TOP,
              height: HIGHLIGHT_HEIGHT,
              left: bubbleX,
              width: bubbleWidth,
              borderRadius: state.index === 2 ? CENTER_SIZE / 2 : 12,
            }
          ]}
        />

        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index
          const isCenter = index === 2
          const color = isFocused ? '#1D9E75' : '#4A5E56'

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true
                })
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name)
                }
              }}
              activeOpacity={0.7}
            >
              {isCenter ? (
                <>
                  <View style={styles.centerArcWrapper}>
                    <View style={[
                      styles.centerArc,
                      { borderColor: isFocused ? '#1D9E75' : '#1D3028' }
                    ]} />
                  </View>
                  <MaterialCommunityIcons
                    name="brain"
                    size={52}
                    color={color}
                    style={styles.brainIcon}
                  />
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color }]}>{TABS[index].label}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.normalContent}>
                  {index === 0 && <Ionicons name="home-outline" size={ICON_SIZE} color={color} />}
                  {index === 1 && <Ionicons name="stats-chart-outline" size={ICON_SIZE} color={color} />}
                  {index === 3 && <MaterialCommunityIcons name="golf" size={ICON_SIZE} color={color} />}
                  {index === 4 && <Ionicons name="person-outline" size={ICON_SIZE} color={color} />}
                  <Text style={[styles.label, { color }]}>{TABS[index].label}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: '#1D3028',
    height: TAB_BAR_HEIGHT,
    position: 'relative',
    overflow: 'visible',
  },
  highlight: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#1D9E75',
    backgroundColor: 'rgba(29, 158, 117, 0.08)',
    zIndex: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: LABEL_BOTTOM,
    overflow: 'visible',
    zIndex: 1,
  },
  normalContent: {
    alignItems: 'center',
    gap: GAP,
  },
  centerArcWrapper: {
    position: 'absolute',
    top: -(CENTER_SIZE / 2),
    alignItems: 'center',
    width: CENTER_SIZE,
    height: CENTER_SIZE / 2,
    overflow: 'hidden',
  },
  centerArc: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  brainIcon: {
    position: 'absolute',
    top: -(52 / 2) + 8,
    zIndex: 2,
  },
  labelRow: {
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
})

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
      <Tab.Screen name="Play" component={PlayStack} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  )
}