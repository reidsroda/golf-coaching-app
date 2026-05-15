import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  PanResponder, Dimensions, ScrollView
} from 'react-native'
import { supabase } from '../lib/supabase'

const { width } = Dimensions.get('window')
const BUBBLE_SIZE = width * 0.72
const NUM_PARTICLES = 28

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

type Particle = {
  x: Animated.Value
  y: Animated.Value
  opacity: Animated.Value
  size: number
  baseX: number
  baseY: number
}

export default function HomeScreen({ navigation }: any) {
  const [handicap, setHandicap] = useState<number | null>(null)
  const [trend, setTrend] = useState<number | null>(null)
  const [recentScores, setRecentScores] = useState<number[]>([])
  const [userName, setUserName] = useState('')
  const touchX = useRef(new Animated.Value(0)).current
  const touchY = useRef(new Animated.Value(0)).current

  const particles = useRef<Particle[]>(
    Array.from({ length: NUM_PARTICLES }, () => {
      const bx = randomBetween(0.1, 0.9)
      const by = randomBetween(0.1, 0.9)
      return {
        x: new Animated.Value(bx),
        y: new Animated.Value(by),
        opacity: new Animated.Value(randomBetween(0.3, 0.9)),
        size: randomBetween(3, 10),
        baseX: bx,
        baseY: by
      }
    })
  ).current

  useEffect(() => {
    loadData()
    animateParticles()
  }, [])

  function animateParticles() {
    particles.forEach(p => {
      const drift = () => {
        const newX = p.baseX + randomBetween(-0.12, 0.12)
        const newY = p.baseY + randomBetween(-0.12, 0.12)
        Animated.parallel([
          Animated.timing(p.x, { toValue: Math.max(0.05, Math.min(0.95, newX)), duration: randomBetween(2000, 4000), useNativeDriver: false }),
          Animated.timing(p.y, { toValue: Math.max(0.05, Math.min(0.95, newY)), duration: randomBetween(2000, 4000), useNativeDriver: false }),
          Animated.timing(p.opacity, { toValue: randomBetween(0.2, 0.8), duration: randomBetween(1500, 3000), useNativeDriver: false }),
        ]).start(drift)
      }
      drift()
    })
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gs) => {
        touchX.setValue(gs.moveX)
        touchY.setValue(gs.moveY)
        particles.forEach(p => {
            const px = (p.x as any)._value * BUBBLE_SIZE
            const py = (p.y as any)._value * BUBBLE_SIZE
            const bx = evt.nativeEvent.locationX
            const by = evt.nativeEvent.locationY
            const dist = Math.sqrt((px - bx) ** 2 + (py - by) ** 2)
          if (dist < 60) {
            const angle = Math.atan2(py - by, px - bx)
            const flee = 0.15
            Animated.timing(p.x, {
              toValue: Math.max(0.05, Math.min(0.95, (p.x as any)._value + Math.cos(angle) * flee)),
              duration: 200, useNativeDriver: false
            }).start()
            Animated.timing(p.y, {
              toValue: Math.max(0.05, Math.min(0.95, (p.y as any)._value + Math.sin(angle) * flee)),
              duration: 200, useNativeDriver: false
            }).start()
          }
        })
      }
    })
  ).current

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('name, handicap')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserName(profile.name?.split(' ')[0] || '')
      setHandicap(profile.handicap)
    }

    const { data: rounds } = await supabase
      .from('rounds')
      .select('total_score, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10)

    if (rounds && rounds.length > 0) {
      const scores = rounds.map(r => r.total_score)
      setRecentScores(scores)
      if (scores.length >= 2) {
        setTrend(scores[0] - scores[1])
      }
    }
  }

  const displayHandicap = handicap !== null ? handicap.toFixed(1) : '—'
  const trendText = trend === null ? null : trend === 0 ? 'No change' : trend < 0 ? `${Math.abs(trend)} better vs last round` : `${trend} higher vs last round`
  const trendPositive = trend !== null && trend <= 0

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning, {userName || 'Golfer'}</Text>
        <Text style={styles.headerLabel}>HANDICAP INDEX</Text>
      </View>

      <View style={styles.bubbleWrapper}>
        <View style={styles.bubbleOuter} {...panResponder.panHandlers}>
          <View style={styles.bubbleGlow} />
          {particles.map((p, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  width: p.size, height: p.size, borderRadius: p.size / 2,
                  opacity: p.opacity,
                  left: p.x.interpolate({ inputRange: [0, 1], outputRange: [0, BUBBLE_SIZE] }),
                  top: p.y.interpolate({ inputRange: [0, 1], outputRange: [0, BUBBLE_SIZE] }),
                }
              ]}
            />
          ))}
          <View style={styles.bubbleCenter}>
            <Text style={styles.handicapNumber}>{displayHandicap}</Text>
            <Text style={styles.handicapLabel}>HANDICAP</Text>
            {trendText && (
              <Text style={[styles.trendText, { color: trendPositive ? '#5DCAA5' : '#F09595' }]}>
                {trendText}
              </Text>
            )}
          </View>
        </View>
      </View>

      {recentScores.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>RECENT FORM</Text>
          <View style={styles.scoreRow}>
            {recentScores.slice(0, 6).map((score, i) => {
              const max = Math.max(...recentScores.slice(0, 6))
              const min = Math.min(...recentScores.slice(0, 6))
              const range = max - min || 1
              const height = 20 + ((max - score) / range) * 44
              return (
                <View key={i} style={styles.scoreBarWrapper}>
                  <Text style={styles.scoreBarLabel}>{score}</Text>
                  <View style={[styles.scoreBar, { height, backgroundColor: i === 0 ? '#1D9E75' : '#2A3A33' }]} />
                </View>
              )
            })}
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Play')}>
          <Text style={styles.primaryActionText}>+ LOG ROUND</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {[
          { label: 'ROUNDS', value: recentScores.length.toString() },
          { label: 'AVG SCORE', value: recentScores.length > 0 ? (recentScores.reduce((a, b) => a + b, 0) / recentScores.length).toFixed(1) : '—' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1210' },
  container: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
  greeting: { fontSize: 13, color: '#5DCAA5', fontWeight: '500', letterSpacing: 0.5, marginBottom: 4 },
  headerLabel: { fontSize: 11, color: '#4A5E56', letterSpacing: 2, fontWeight: '500' },
  bubbleWrapper: { alignItems: 'center', marginVertical: 24 },
  bubbleOuter: {
    width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#111F18',
    borderWidth: 1.5, borderColor: '#1D4535',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  bubbleGlow: {
    position: 'absolute', width: BUBBLE_SIZE * 0.6, height: BUBBLE_SIZE * 0.6,
    borderRadius: BUBBLE_SIZE * 0.3, backgroundColor: '#0F3025',
    top: BUBBLE_SIZE * 0.2, left: BUBBLE_SIZE * 0.2,
  },
  particle: { position: 'absolute', backgroundColor: '#5DCAA5' },
  bubbleCenter: { alignItems: 'center', zIndex: 10 },
  handicapNumber: { fontSize: 72, fontWeight: '200', color: '#FFFFFF', letterSpacing: -2, lineHeight: 80 },
  handicapLabel: { fontSize: 11, color: '#4A5E56', letterSpacing: 3, fontWeight: '500', marginTop: 4 },
  trendText: { fontSize: 13, marginTop: 8, fontWeight: '400' },
  statsCard: {
    marginHorizontal: 24, backgroundColor: '#111F18',
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 0.5, borderColor: '#1D4535'
  },
  cardTitle: { fontSize: 11, color: '#4A5E56', letterSpacing: 2, fontWeight: '500', marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80 },
  scoreBarWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  scoreBarLabel: { fontSize: 11, color: '#8AADA0' },
  scoreBar: { width: '100%', borderRadius: 4 },
  actionsRow: { paddingHorizontal: 24, marginBottom: 16 },
  primaryAction: {
    backgroundColor: '#1D9E75', borderRadius: 12,
    padding: 16, alignItems: 'center'
  },
  primaryActionText: { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 2 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#111F18', borderRadius: 12,
    padding: 16, borderWidth: 0.5, borderColor: '#1D4535'
  },
  statValue: { fontSize: 28, fontWeight: '200', color: '#FFFFFF', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#4A5E56', letterSpacing: 2, fontWeight: '500' },
})