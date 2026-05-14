import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSignIn() {
    setLoading(true)
    setErrorMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)

      if (newFailedAttempts >= 3) {
        setErrorMessage('Too many failed attempts. Please reset your password.')
      } else {
        setErrorMessage(`Incorrect email or password. ${3 - newFailedAttempts} attempt${3 - newFailedAttempts === 1 ? '' : 's'} remaining.`)
      }
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          {failedAttempts >= 3 && (
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.resetLink}>Reset Password →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#1A1A1A'
  },
  errorBox: {
    backgroundColor: '#FCEBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#791F1F',
    fontSize: 14,
    marginBottom: 4
  },
  resetLink: {
    color: '#1D9E75',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16
  },
  button: {
    backgroundColor: '#1D9E75',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})