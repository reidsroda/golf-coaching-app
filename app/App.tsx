import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts, Fraunces_700Bold, Fraunces_700Bold_Italic } from '@expo-google-fonts/fraunces'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from './src/lib/supabase'

import WelcomeScreen from './src/screens/WelcomeScreen'
import SignUpScreen from './src/screens/SignUpScreen'
import SignInScreen from './src/screens/SignInScreen'
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen'
import OnboardingGolfInfoScreen from './src/screens/OnboardingGolfInfoScreen'
import OnboardingMoreScreen from './src/screens/OnboardingMoreScreen'
import OnboardingBagScreen from './src/screens/OnboardingBagScreen'
import OnboardingSwingThoughtsScreen from './src/screens/OnboardingSwingThoughtsScreen'
import OnboardingCommonMissScreen from './src/screens/OnboardingCommonMissScreen'
import TabNavigator from './src/navigation/TabNavigator'
import { C } from './src/theme'

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Fraunces_700Bold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.pageBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.fairway} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={session ? 'authed' : 'unauthed'}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {session ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="OnboardingGolfInfo" component={OnboardingGolfInfoScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="OnboardingMore" component={OnboardingMoreScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="OnboardingBag" component={OnboardingBagScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="OnboardingSwingThoughts" component={OnboardingSwingThoughtsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="OnboardingCommonMiss" component={OnboardingCommonMissScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}