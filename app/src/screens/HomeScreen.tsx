import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../lib/supabase'

export default function HomeScreen() {
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error', error.message)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to AI Golf Coach</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#1A1A1A'
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