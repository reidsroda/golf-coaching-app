import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'
import HomeScreen from '../screens/HomeScreen'
import ActivityScreen from '../screens/ActivityScreen'
import AssistantScreen from '../screens/AssistantScreen'
import AccountScreen from '../screens/AccountScreen'
import AddRoundScreen from '../screens/AddRoundScreen'
import EnterScoresScreen from '../screens/EnterScoresScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function PlayStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddRound" component={AddRoundScreen} />
      <Stack.Screen name="EnterScores" component={EnterScoresScreen} />
    </Stack.Navigator>
  )
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D9E75',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: '#EEEEEE',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⛳</Text> }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{ tabBarLabel: 'Activity', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text> }}
      />
      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{ tabBarLabel: 'Assistant', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🤖</Text> }}
      />
      <Tab.Screen
        name="Play"
        component={PlayStack}
        options={{ tabBarLabel: 'Play', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏌️</Text> }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarLabel: 'Account', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }}
      />
    </Tab.Navigator>
  )
}