import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'

export default function ProfileSetupScreen() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [handicap, setHandicap] = useState('')
  const [homeCourse, setHomeCourse] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSaveProfile() {
  setLoading(true)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    Alert.alert('Error', 'No user found')
    setLoading(false)
    return
  }

  const { error } = await supabase.from('users').upsert({
    id: user.id,
    email: user.email,
    name,
    age: parseInt(age),
    handicap: parseFloat(handicap),
    home_course: homeCourse
  })

  if (error) {
    Alert.alert('Error', error.message)
  } else {
    Alert.alert('Profile saved!', 'Welcome to AI Golf Coach!', [
      {
        text: 'Continue',
        onPress: () => supabase.auth.refreshSession()
      }
    ])
  }
  setLoading(false)
}

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself so we can personalize your experience</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="John Smith"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder="35"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Handicap Index</Text>
      <TextInput
        style={styles.input}
        placeholder="12.4"
        value={handicap}
        onChangeText={setHandicap}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Home Course</Text>
      <TextInput
        style={styles.input}
        placeholder="Pebble Beach Golf Links"
        value={homeCourse}
        onChangeText={setHomeCourse}
        autoCapitalize="words"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    flexGrow: 1
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1A1A1A'
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 32
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16
  },
  button: {
    backgroundColor: '#1D9E75',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})