import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'

export default function HomeScreen({ navigation }: any) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Golf Coach</Text>
      <Text style={styles.subtitle}>Track your game and improve faster</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AddRound')}
      >
        <Text style={styles.buttonText}>+ Log New Round</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 48
  },
  button: {
    backgroundColor: '#1D9E75',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  signOutButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC'
  },
  signOutText: {
    color: '#888888',
    fontSize: 16
  }
})