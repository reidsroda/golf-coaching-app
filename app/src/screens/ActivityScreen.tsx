import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { supabase } from '../lib/supabase'
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg'

const { width } = Dimensions.get('window')
const CHART_SIZE = width - 80
const CENTER = CHART_SIZE / 2
const RADIUS = CHART_SIZE * 0.36

const BENCHMARKS = {
  gir: 33,
  putts: 36,
  fairways: 42,
  penalties: 1.5,
  score: 90
}

const AXES = [
  { key: 'gir', label: 'GIR %', higher_better: true, max: 100 },
  { key: 'fairways', label: 'Fairways %', higher_better: true, max: 100 },
  { key: 'score', label: 'Score', higher_better: false, max: 120 },
  { key: 'penalties', label: 'Penalties', higher_better: false, max: 6 },
  { key: 'putts', label: 'Putts', higher_better: false, max: 44 },
]

function getPoint(index: number, total: number, value: number, radius: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: CENTER + radius * value * Math.cos(angle),
    y: CENTER + radius * value * Math.sin(angle),
  }
}

function normalizeValue(key: string, value: number, higher_better: boolean, max: number) {
  const raw = value / max
  return higher_better ? raw : 1 - raw
}

export default function ActivityScreen() {
  const [stats, setStats] = useState<any>(null)
  const [roundCount, setRoundCount] = useState(0)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: rounds } = await supabase
      .from('rounds')
      .select('total_score, total_putts, fairways_hit, gir, penalties, holes')
      .eq('user_id', user.id)

    if (!rounds || rounds.length === 0) return
    setRoundCount(rounds.length)

    const r18 = rounds.filter(r => r.holes === 18)
    const base = r18.length > 0 ? r18 : rounds

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

    const girPct = avg(base.map(r => (r.gir / 18) * 100))
    const fairwayPct = avg(base.map(r => (r.fairways_hit / 14) * 100))
    const avgScore = avg(base.map(r => r.total_score))
    const avgPutts = avg(base.map(r => r.total_putts))
    const avgPenalties = avg(base.map(r => r.penalties))

    setStats({ gir: girPct, fairways: fairwayPct, score: avgScore, putts: avgPutts, penalties: avgPenalties })
  }

  const userPoints = stats ? AXES.map((axis, i) => {
    const norm = normalizeValue(axis.key, stats[axis.key], axis.higher_better, axis.max)
    return getPoint(i, AXES.length, Math.min(Math.max(norm, 0), 1), RADIUS)
  }) : []

  const benchPoints = AXES.map((axis, i) => {
    const norm = normalizeValue(axis.key, BENCHMARKS[axis.key as keyof typeof BENCHMARKS], axis.higher_better, axis.max)
    return getPoint(i, AXES.length, Math.min(Math.max(norm, 0), 1), RADIUS)
  })

  const userPolygon = userPoints.map(p => `${p.x},${p.y}`).join(' ')
  const benchPolygon = benchPoints.map(p => `${p.x},${p.y}`).join(' ')

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>ACTIVITY</Text>
      <Text style={styles.pageSubtitle}>{roundCount} rounds logged</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>PERFORMANCE RADAR</Text>
        <Text style={styles.cardSubtitle}>vs. average amateur golfer</Text>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1D9E75' }]} />
            <Text style={styles.legendText}>Your game</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2A4A5E' }]} />
            <Text style={styles.legendText}>Amateur avg</Text>
          </View>
        </View>

        {stats ? (
          <Svg width={CHART_SIZE} height={CHART_SIZE} style={{ alignSelf: 'center' }}>
            {gridLevels.map(level => {
              const pts = AXES.map((_, i) => getPoint(i, AXES.length, level, RADIUS))
              return (
                <Polygon
                  key={level}
                  points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke="#1D3028" strokeWidth="1"
                />
              )
            })}

            {AXES.map((_, i) => {
              const outer = getPoint(i, AXES.length, 1, RADIUS)
              return <Line key={i} x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="#1D3028" strokeWidth="1" />
            })}

            <Polygon points={benchPolygon} fill="#1A3A4A" fillOpacity={0.6} stroke="#378ADD" strokeWidth={1.5} />
            <Polygon points={userPolygon} fill="#0F3025" fillOpacity={0.8} stroke="#1D9E75" strokeWidth={2} />

            {userPoints.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#1D9E75" />
            ))}

            {AXES.map((axis, i) => {
              const labelPt = getPoint(i, AXES.length, 1.28, RADIUS)
              return (
                <SvgText key={i} x={labelPt.x} y={labelPt.y} textAnchor="middle" fontSize="11"
                  fill="#5DCAA5" fontWeight="500">
                  {axis.label}
                </SvgText>
              )
            })}
          </Svg>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>Log rounds to see your radar</Text>
          </View>
        )}
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          {[
            { label: 'AVG SCORE', value: stats.score.toFixed(1), good: stats.score < BENCHMARKS.score },
            { label: 'GIR %', value: `${stats.gir.toFixed(0)}%`, good: stats.gir > BENCHMARKS.gir },
            { label: 'FAIRWAYS %', value: `${stats.fairways.toFixed(0)}%`, good: stats.fairways > BENCHMARKS.fairways },
            { label: 'AVG PUTTS', value: stats.putts.toFixed(1), good: stats.putts < BENCHMARKS.putts },
            { label: 'AVG PENALTIES', value: stats.penalties.toFixed(1), good: stats.penalties < BENCHMARKS.penalties },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.good ? '#5DCAA5' : '#F09595' }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1210' },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  pageTitle: { fontSize: 11, color: '#4A5E56', letterSpacing: 3, fontWeight: '500' },
  pageSubtitle: { fontSize: 28, fontWeight: '200', color: '#FFFFFF', marginBottom: 24 },
  card: {
    backgroundColor: '#111F18', borderRadius: 16,
    padding: 20, marginBottom: 16,
    borderWidth: 0.5, borderColor: '#1D4535'
  },
  cardTitle: { fontSize: 11, color: '#4A5E56', letterSpacing: 2, fontWeight: '500' },
  cardSubtitle: { fontSize: 13, color: '#5DCAA5', marginTop: 2, marginBottom: 16 },
  legendRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#8AADA0' },
  emptyChart: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#4A5E56', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%', backgroundColor: '#111F18', borderRadius: 12,
    padding: 16, borderWidth: 0.5, borderColor: '#1D4535'
  },
  statValue: { fontSize: 24, fontWeight: '200', marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#4A5E56', letterSpacing: 2, fontWeight: '500' },
})