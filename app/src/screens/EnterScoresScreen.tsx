import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'

type HoleData = {
  score: string
  putts: string
  fairway_hit: boolean | null
  gir: boolean
  penalties: string
}

export default function EnterScoresScreen({ route, navigation }: any) {
  const { round, holes } = route.params
  const holeCount = holes === 9 ? 9 : 18

  const emptyHole = (): HoleData => ({
    score: '',
    putts: '',
    fairway_hit: null,
    gir: false,
    penalties: '0'
  })

  const [currentHole, setCurrentHole] = useState(0)
  const [holeData, setHoleData] = useState<HoleData[]>(
    Array.from({ length: holeCount }, emptyHole)
  )
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const hole = holeData[currentHole]
  const isLastHole = currentHole === holeCount - 1

  // Par 3s don't have fairways — simplified: ask fairway on all holes for MVP
  // Can refine with course data in later phase

  function updateHole(field: keyof HoleData, value: any) {
    const updated = [...holeData]
    updated[currentHole] = { ...updated[currentHole], [field]: value }
    setHoleData(updated)
  }

    function validateHole() {
    const score = parseInt(hole.score)
    const putts = parseInt(hole.putts)
    const penalties = parseInt(hole.penalties) || 0

    if (!hole.score || isNaN(score)) return 'Please enter a score'
    if (score <= 0) return 'Score must be greater than 0'
    if (!hole.putts || isNaN(putts)) return 'Please enter number of putts'
    if (putts < 0) return 'Putts cannot be negative'
    if (hole.fairway_hit === null) return 'Please select Yes or No for Fairway Hit'
    if (putts + penalties > score) return `Score of ${score} is not possible with ${putts} putts and ${penalties} penalties — please check your numbers`

    return null
    }

  function handleNext() {
    const error = validateHole()
    if (error) {
      setErrorMessage(error)
      return
    }
    setErrorMessage('')
    setCurrentHole(currentHole + 1)
  }

  async function handleFinish() {
    const error = validateHole()
    if (error) {
      setErrorMessage(error)
      return
    }

    setLoading(true)
    setErrorMessage('')

    const holeRows = holeData.map((h, index) => ({
      round_id: round.id,
      hole_number: index + 1,
      score: parseInt(h.score),
      putts: parseInt(h.putts),
      fairway_hit: h.fairway_hit ?? false,
      gir: h.gir,
      penalties: parseInt(h.penalties) || 0
    }))

    const { error: holesError } = await supabase.from('holes').insert(holeRows)

    if (holesError) {
      setErrorMessage(holesError.message)
      setLoading(false)
      return
    }

    const totalScore = holeData.reduce((sum, h) => sum + (parseInt(h.score) || 0), 0)
    const totalPutts = holeData.reduce((sum, h) => sum + (parseInt(h.putts) || 0), 0)
    const fairwaysHit = holeData.filter(h => h.fairway_hit).length
    const girCount = holeData.filter(h => h.gir).length
    const totalPenalties = holeData.reduce((sum, h) => sum + (parseInt(h.penalties) || 0), 0)

    const { error: roundError } = await supabase
      .from('rounds')
      .update({
        total_score: totalScore,
        total_putts: totalPutts,
        fairways_hit: fairwaysHit,
        gir: girCount,
        penalties: totalPenalties
      })
      .eq('id', round.id)

    if (roundError) {
      setErrorMessage(roundError.message)
    } else {
      navigation.navigate('Home')
    }
    setLoading(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.progressBar}>
        {Array.from({ length: holeCount }, (_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < currentHole && styles.progressDotDone,
              i === currentHole && styles.progressDotActive
            ]}
          />
        ))}
      </View>

      <Text style={styles.holeLabel}>Hole {currentHole + 1} of {holeCount}</Text>
      <Text style={styles.courseName}>{round.course_name}</Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.card}>

        <Text style={styles.fieldLabel}>Score</Text>
        <TextInput
          style={styles.input}
          placeholder="4"
          value={hole.score}
          onChangeText={(val) => updateHole('score', val)}
          keyboardType="numeric"
          maxLength={2}
        />

        <Text style={styles.fieldLabel}>Putts</Text>
        <TextInput
          style={styles.input}
          placeholder="2"
          value={hole.putts}
          onChangeText={(val) => updateHole('putts', val)}
          keyboardType="numeric"
          maxLength={2}
        />

        <Text style={styles.fieldLabel}>Penalties</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={hole.penalties}
          onChangeText={(val) => updateHole('penalties', val)}
          keyboardType="numeric"
          maxLength={2}
        />

        <Text style={styles.fieldLabel}>Fairway Hit</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, hole.fairway_hit === true && styles.toggleActive]}
            onPress={() => updateHole('fairway_hit', true)}
          >
            <Text style={[styles.toggleText, hole.fairway_hit === true && styles.toggleTextActive]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, hole.fairway_hit === false && styles.toggleActive]}
            onPress={() => updateHole('fairway_hit', false)}
          >
            <Text style={[styles.toggleText, hole.fairway_hit === false && styles.toggleTextActive]}>No</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Green in Regulation</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, hole.gir === true && styles.toggleActive]}
            onPress={() => updateHole('gir', true)}
          >
            <Text style={[styles.toggleText, hole.gir === true && styles.toggleTextActive]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, hole.gir === false && styles.toggleActive]}
            onPress={() => updateHole('gir', false)}
          >
            <Text style={[styles.toggleText, hole.gir === false && styles.toggleTextActive]}>No</Text>
          </TouchableOpacity>
        </View>

      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={isLastHole ? handleFinish : handleNext}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : isLastHole ? 'Finish Round ✓' : `Next → Hole ${currentHole + 2}`}
        </Text>
      </TouchableOpacity>

      {currentHole > 0 && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setErrorMessage('')
            setCurrentHole(currentHole - 1)
          }}
        >
          <Text style={styles.backText}>← Back to Hole {currentHole}</Text>
        </TouchableOpacity>
      )}

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
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 24,
    flexWrap: 'wrap'
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EEEEEE'
  },
  progressDotDone: {
    backgroundColor: '#9FE1CB'
  },
  progressDotActive: {
    backgroundColor: '#1D9E75',
    width: 16
  },
  holeLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4
  },
  courseName: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 24
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
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: '#EEEEEE'
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#fff',
    width: 80
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  toggleActive: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75'
  },
  toggleText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500'
  },
  toggleTextActive: {
    color: '#fff'
  },
  button: {
    backgroundColor: '#1D9E75',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  backButton: {
    padding: 12,
    alignItems: 'center'
  },
  backText: {
    color: '#888888',
    fontSize: 14
  }
})