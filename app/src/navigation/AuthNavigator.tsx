import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SignUpScreen from '../screens/SignUpScreen'
import SignInScreen from '../screens/SignInScreen'

const Stack = createNativeStackNavigator()

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  )
}