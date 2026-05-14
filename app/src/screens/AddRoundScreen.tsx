import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'

export default function AddRoundScreen({ navigation }: any) {
  const [courseName, setCourseName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [holes, setHoles] = useState<9 | 18>(18)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleStartRound() {
    if (!courseName) {
      setErrorMessage('Please enter a course name')
      return
    }

    setLoading(true)
    setErrorMessage('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setErrorMessage('No user found')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.from('rounds').insert({
      user_id: user.id,
      course_name: courseName,
      date,
      holes,
      total_score: 0,
      total_putts: 0,
      fairways_hit: 0,
      gir: 0,
      penalties: 0
    }).select().single()

    if (error) {
      setErrorMessage(error.message)
    } else {
      navigation.navigate('EnterScores', { round: data, holes })
    }
    setLoading(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New Round</Text>
      <Text style={styles.subtitle}>Tell us about your round</Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Course Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Pebble Beach Golf Links"
        value={courseName}
        onChangeText={setCourseName}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

      <Text style={styles.label}>Number of Holes</Text>
      <View style={styles.holesContainer}>
        <TouchableOpacity
          style={[styles.holesButton, holes === 9 && styles.holesButtonActive]}
          onPress={() => setHoles(9)}
        >
          <Text style={[styles.holesButtonText, holes === 9 && styles.holesButtonTextActive]}>9 Holes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.holesButton, holes === 18 && styles.holesButtonActive]}
          onPress={() => setHoles(18)}
        >
          <Text style={[styles.holesButtonText, holes === 18 && styles.holesButtonTextActive]}>18 Holes</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleStartRound}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Starting...' : 'Start Round →'}</Text>
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
  errorBox: {
    backgroundColor: '#FCEBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#791F1F',
    fontSize: 14
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
  holesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32
  },
  holesButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    alignItems: 'center'
  },
  holesButtonActive: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75'
  },
  holesButtonText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500'
  },
  holesButtonTextActive: {
    color: '#fff'
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