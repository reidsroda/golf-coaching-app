import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')
const CHART_SIZE = width - 60
const CENTER = CHART_SIZE / 2
const RADIUS = CHART_SIZE * 0.33

type Round = {
  total_score: number; total_putts: number; fairways_hit: number
  gir: number; penalties: number; holes: number
}

// Handicap benchmarks per category
const HANDICAPS = {
  15: { offTee: 38, approach: 22, shortGame: 35, putting: 34, scoring: 87, bigNumbers: 5 },
  10: { offTee: 48, approach: 33, shortGame: 42, putting: 32, scoring: 82, bigNumbers: 3.5 },
  5:  { offTee: 58, approach: 44, shortGame: 52, putting: 30, scoring: 77, bigNumbers: 2.5 },
  0:  { offTee: 68, approach: 58, shortGame: 64, putting: 29, scoring: 72, bigNumbers: 1.5 },
}

const AXES = [
  { key: 'offTee',     label: 'Off the tee',  sub: 'FAIRWAYS',        higher_better: true,  max: 100 },
  { key: 'approach',   label: 'Approach',      sub: 'GREENS HIT',      higher_better: true,  max: 100 },
  { key: 'shortGame',  label: 'Short game',    sub: 'UP & DOWNS',      higher_better: true,  max: 100 },
  { key: 'scoring',    label: 'Scoring',       sub: 'AVG TO PAR',      higher_better: false, max: 120 },
  { key: 'putting',    label: 'Putting',       sub: 'PUTTS / ROUND',   higher_better: false, max: 44  },
  { key: 'bigNumbers', label: 'Avoiding\nbig numbers', sub: 'DOUBLES & PENALTIES', higher_better: false, max: 10 },
]

function radarPoint(index: number, total: number, norm: number, r: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return { x: CENTER + r * norm * Math.cos(angle), y: CENTER + r * norm * Math.sin(angle) }
}

function norm(val: number, higher_better: boolean, max: number) {
  const raw = Math.min(val / max, 1)
  return Math.max(0, higher_better ? raw : 1 - raw)
}

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

export default function SpiderChartScreen({ route, navigation }: any) {
  const { rounds } = route.params as { rounds: Round[] }
  const [selectedHdcp, setSelectedHdcp] = useState<15 | 10 | 5 | 0>(10)

  const base = rounds.filter(r => r.holes === 18).length > 0
    ? rounds.filter(r => r.holes === 18) : rounds

  // User stats mapped to axes
  const userStats = {
    offTee:     avg(base.map(r => (r.fairways_hit / 14) * 100)),
    approach:   avg(base.map(r => (r.gir / 18) * 100)),
    shortGame:  50, // placeholder
    scoring:    avg(base.map(r => r.total_score)),
    putting:    avg(base.map(r => r.total_putts)),
    bigNumbers: avg(base.map(r => r.penalties)),
  }

  const benchmark = HANDICAPS[selectedHdcp]

  // Closest/furthest axis
  const diffs = AXES.map(axis => {
    const uNorm = norm(userStats[axis.key as keyof typeof userStats], axis.higher_better, axis.max)
    const bNorm = norm(benchmark[axis.key as keyof typeof benchmark], axis.higher_better, axis.max)
    return { label: axis.label, diff: Math.abs(uNorm - bNorm), ahead: uNorm > bNorm }
  })
  const closest = diffs.reduce((a, b) => a.diff < b.diff ? a : b)
  const furthest = diffs.reduce((a, b) => a.diff > b.diff ? a : b)

  const userPoints = AXES.map((axis, i) => {
    const n = norm(userStats[axis.key as keyof typeof userStats], axis.higher_better, axis.max)
    return radarPoint(i, AXES.length, Math.min(Math.max(n, 0), 1), RADIUS)
  })

  const benchPoints = AXES.map((axis, i) => {
    const n = norm(benchmark[axis.key as keyof typeof benchmark], axis.higher_better, axis.max)
    return radarPoint(i, AXES.length, Math.min(Math.max(n, 0), 1), RADIUS)
  })

  const hdcpLabels: { val: 15 | 10 | 5 | 0; label: string }[] = [
    { val: 15, label: '15 handicap' },
    { val: 10, label: '10 handicap' },
    { val: 5,  label: '5 handicap' },
    { val: 0,  label: 'Scratch' },
  ]

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Spider chart</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Headline */}
        <Text style={s.eyebrow}>YOUR GAME VS {selectedHdcp === 0 ? 'SCRATCH' : `${selectedHdcp} HANDICAP`}</Text>
        {base.length > 0 && (
          <Text style={s.headline}>
            Closest in <Text style={[s.headlineAccent, { color: C.fairway }]}>{closest.label.toLowerCase()}</Text>
            {', '}furthest in{' '}
            <Text style={[s.headlineAccent, { color: C.errorRed }]}>{furthest.label.toLowerCase().replace('\n', ' ')}</Text>.
          </Text>
        )}

        {/* Handicap selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hdcpScroll} contentContainerStyle={s.hdcpRow}>
          {hdcpLabels.map(({ val, label }) => (
            <TouchableOpacity
              key={val}
              style={[s.hdcpBtn, selectedHdcp === val && s.hdcpBtnActive]}
              onPress={() => setSelectedHdcp(val)}
            >
              <Text style={[s.hdcpBtnText, selectedHdcp === val && s.hdcpBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Legend */}
        <View style={s.legendRow}>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.fairway }]} /><Text style={s.legendText}>You</Text></View>
          <View style={s.legendItem}>
            <View style={[s.legendDotDashed]} />
            <Text style={s.legendText}>{selectedHdcp === 0 ? 'Scratch' : `${selectedHdcp} handicap`}</Text>
          </View>
        </View>

        {/* Radar */}
        <View style={s.chartWrap}>
          <Svg width={CHART_SIZE} height={CHART_SIZE} style={{ alignSelf: 'center' }}>
            {[0.25, 0.5, 0.75, 1.0].map(level => (
              <Polygon key={level}
                points={AXES.map((_, i) => { const p = radarPoint(i, AXES.length, level, RADIUS); return `${p.x},${p.y}` }).join(' ')}
                fill="none" stroke={C.border} strokeWidth="1"
              />
            ))}
            {AXES.map((_, i) => {
              const o = radarPoint(i, AXES.length, 1, RADIUS)
              return <Line key={i} x1={CENTER} y1={CENTER} x2={o.x} y2={o.y} stroke={C.border} strokeWidth="1" />
            })}
            {/* Benchmark */}
            <Polygon
              points={benchPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill={C.clay} fillOpacity={0.12}
              stroke={C.clay} strokeWidth={1.5} strokeDasharray="5,3"
            />
            {/* User */}
            <Polygon
              points={userPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill={C.fairway} fillOpacity={0.18}
              stroke={C.fairway} strokeWidth={2}
            />
            {userPoints.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={4} fill={C.fairway} />
            ))}
            {/* Labels */}
            {AXES.map((axis, i) => {
              const lp = radarPoint(i, AXES.length, 1.28, RADIUS)
              const lines = axis.label.split('\n')
              return lines.map((line, li) => (
                <SvgText key={`${i}-${li}`} x={lp.x} y={lp.y + li * 14} textAnchor="middle" fontSize="11" fill={C.ink2} fontWeight="500">
                  {line}
                </SvgText>
              ))
            })}
          </Svg>
        </View>

        {/* Facet breakdown */}
        <Text style={s.facetTitle}>FACET BY FACET</Text>
        <View style={s.facetRight}><Text style={s.facetSub}>YOU vs {selectedHdcp === 0 ? 'SCRATCH' : `${selectedHdcp} HANDICAP`}</Text></View>

        <View style={s.facetList}>
          {AXES.map((axis, i) => {
            const uNorm = norm(userStats[axis.key as keyof typeof userStats], axis.higher_better, axis.max)
            const bNorm = norm(benchmark[axis.key as keyof typeof benchmark], axis.higher_better, axis.max)
            const diff = uNorm - bNorm
            const better = diff > 0
            const barW = width - 100

            return (
              <View key={axis.key} style={[s.facetRow, i < AXES.length - 1 && s.facetRowBorder]}>
                <View style={s.facetLeft}>
                  <Text style={s.facetLabel}>{axis.label.replace('\n', ' ')}</Text>
                  <Text style={s.facetSub2}>{axis.sub}</Text>
                </View>
                <View style={s.facetBars}>
                  {/* User bar */}
                  <View style={[s.facetBar, { width: Math.max(4, uNorm * barW * 0.7), backgroundColor: C.fairway }]} />
                  {/* Benchmark bar */}
                  <View style={[s.facetBar, { width: Math.max(4, bNorm * barW * 0.7), backgroundColor: C.clay, opacity: 0.6 }]} />
                </View>
                <Text style={[s.facetDiff, { color: better ? C.fairway : C.errorRed }]}>
                  {better ? '+' : ''}{Math.round(diff * 100)}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink1 },

  container: { padding: 20, paddingTop: 20 },
  eyebrow: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 6 },
  headline: { fontFamily: F.serifBold, fontSize: 22, color: C.ink1, lineHeight: 28, marginBottom: 20 },
  headlineAccent: { fontFamily: F.serifBoldItalic, fontSize: 22 },

  hdcpScroll: { marginHorizontal: -20, marginBottom: 16 },
  hdcpRow: { paddingHorizontal: 20, gap: 8 },
  hdcpBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border },
  hdcpBtnActive: { backgroundColor: C.ink1, borderColor: C.ink1 },
  hdcpBtnText: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink2 },
  hdcpBtnTextActive: { color: C.onDark },

  legendRow: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDotDashed: { width: 20, height: 2, backgroundColor: C.clay, borderRadius: 1 },
  legendText: { fontFamily: F.sans, fontSize: 12, color: C.ink2 },

  chartWrap: { marginVertical: 8 },

  facetTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 4 },
  facetRight: { marginBottom: 12 },
  facetSub: { fontFamily: F.mono, fontSize: 9, color: C.ink3 },

  facetList: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  facetRow: { paddingHorizontal: 16, paddingVertical: 14 },
  facetRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  facetLeft: { marginBottom: 8 },
  facetLabel: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink1 },
  facetSub2: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },
  facetBars: { gap: 4, marginBottom: 6 },
  facetBar: { height: 6, borderRadius: 3 },
  facetDiff: { fontFamily: F.sansBold, fontSize: 13, textAlign: 'right' },
})