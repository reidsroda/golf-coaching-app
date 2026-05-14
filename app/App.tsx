import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './src/lib/supabase'
import { Session } from '@supabase/supabase-js'
import SignInScreen from './src/screens/SignInScreen'
import SignUpScreen from './src/screens/SignUpScreen'
import HomeScreen from './src/screens/HomeScreen'
import ProfileSetupScreen from './src/screens/ProfileSetupScreen'
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen'
import AddRoundScreen from './src/screens/AddRoundScreen'
import EnterScoresScreen from './src/screens/EnterScoresScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkProfile(session.user.id)
      else setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkProfile(session.user.id)
      else {
        setHasProfile(false)
        setLoading(false)
      }
    })
  }, [])

  async function checkProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    setHasProfile(!!data)
    setLoading(false)
  }

  if (loading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          hasProfile ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="AddRound" component={AddRoundScreen} />
              <Stack.Screen name="EnterScores" component={EnterScoresScreen} />
            </>
          ) : (
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          )
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}