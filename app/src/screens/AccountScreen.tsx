import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'

export default function AccountScreen() {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>Your account details will appear here</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888888', marginBottom: 48 },
  button: { borderWidth: 1, borderColor: '#CCCCCC', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#888888', fontSize: 16 }
})