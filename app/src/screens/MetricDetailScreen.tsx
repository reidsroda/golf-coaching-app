import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')
const CHART_W = width - 40
const CHART_H = 160
const PAD = { top: 16, bottom: 28, left: 10, right: 10 }

type Round = {
  id: string; total_score: number; total_putts: number
  fairways_hit: number; gir: number; penalties: number
  holes: number; date: string; course_name: string
}

function getValue(round: Round, key: string): number {
  switch (key) {
    case 'putts':     return round.total_putts
    case 'fairways':  return round.fairways_hit
    case 'gir':       return round.gir
    case 'penalties': return round.penalties
    case 'score':     return round.total_score
    default:          return 0
  }
}

function formatLabel(key: string, value: number): string {
  if (key === 'fairways') return `${value}`
  return value.toFixed(1)
}

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

export default function MetricDetailScreen({ route, navigation }: any) {
  const { metricKey, metricLabel, rounds, lower_better } = route.params
  const [year, setYear] = useState<number | 'all'>(new Date().getFullYear())

  const base = (rounds as Round[]).filter(r => r.holes === 18).length > 0
    ? (rounds as Round[]).filter(r => r.holes === 18)
    : rounds as Round[]

  const filtered = year === 'all' ? base : base.filter(r => new Date(r.date).getFullYear() === year)
  const allYears = [...new Set(base.map((r: Round) => new Date(r.date).getFullYear()))].sort((a, b) => b - a)

  const chronological = [...filtered].reverse()
  const values = chronological.map(r => getValue(r, metricKey))
  const average = avg(values)

  // Chart coordinates
  const minV = Math.min(...values, average) * 0.9
  const maxV = Math.max(...values, average) * 1.1
  const range = maxV - minV || 1
  const chartW = CHART_W - PAD.left - PAD.right
  const chartH = CHART_H - PAD.top - PAD.bottom

  function toX(i: number) {
    return PAD.left + (i / Math.max(values.length - 1, 1)) * chartW
  }
  function toY(v: number) {
    return PAD.top + (1 - (v - minV) / range) * chartH
  }

  const linePath = values.length > 1
    ? values.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ')
    : ''

  const areaPath = values.length > 1
    ? `${linePath} L${toX(values.length - 1)},${CHART_H} L${toX(0)},${CHART_H} Z`
    : ''

  const avgY = toY(average)

  function cycleYear() {
    if (year === 'all') setYear(allYears[0])
    else {
      const idx = allYears.indexOf(year as number)
      if (idx === allYears.length - 1) setYear('all')
      else setYear(allYears[idx + 1])
    }
  }

  const yearLabel = year === 'all' ? 'All time' : `${year}`

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>{metricLabel.replace('\n', ' ')}</Text>
        <TouchableOpacity style={s.yearPill} onPress={cycleYear}>
          <Text style={s.yearPillText}>{yearLabel}</Text>
          <Ionicons name="chevron-down" size={11} color={C.ink2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Big average */}
        <Text style={s.avgEyebrow}>{yearLabel.toUpperCase()} AVERAGE · PER ROUND</Text>
        <View style={s.avgRow}>
          <Text style={s.avgValue}>{average > 0 ? average.toFixed(1) : '—'}</Text>
          <Text style={s.avgUnit}>{metricKey === 'putts' ? 'putts' : metricKey === 'fairways' ? 'hit' : metricKey}</Text>
        </View>
        <Text style={s.avgSub}>TREND · {yearLabel.toUpperCase()} &nbsp;&nbsp;&nbsp; {filtered.length} ROUNDS</Text>

        {/* Line chart */}
        {values.length > 1 && (
          <View style={s.chartWrap}>
            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={C.fairway} stopOpacity="0.25" />
                  <Stop offset="1" stopColor={C.fairway} stopOpacity="0.02" />
                </LinearGradient>
              </Defs>

              {/* Area fill */}
              <Path d={areaPath} fill="url(#grad)" />

              {/* Avg dashed line */}
              <Line
                x1={PAD.left} y1={avgY} x2={CHART_W - PAD.right} y2={avgY}
                stroke={C.ink3} strokeWidth={1} strokeDasharray="4,4"
              />
              <SvgText x={CHART_W - PAD.right - 2} y={avgY - 4} textAnchor="end" fontSize="9" fill={C.ink3}>
                avg {average.toFixed(1)}
              </SvgText>

              {/* Line */}
              <Path d={linePath} fill="none" stroke={C.fairway} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

              {/* Dots */}
              {values.map((v, i) => (
                <Circle key={i} cx={toX(i)} cy={toY(v)} r={i === values.length - 1 ? 5 : 3}
                  fill={i === values.length - 1 ? C.fairway : C.pageBg}
                  stroke={C.fairway} strokeWidth={i === values.length - 1 ? 0 : 1.5}
                />
              ))}

              {/* X axis date labels */}
              {[0, Math.floor(values.length / 2), values.length - 1].map(i => {
                if (!chronological[i]) return null
                const d = new Date(chronological[i].date)
                const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <SvgText key={i} x={toX(i)} y={CHART_H - 2} textAnchor="middle" fontSize="9" fill={C.ink3}>
                    {label}
                  </SvgText>
                )
              })}
            </Svg>
          </View>
        )}

        {/* Round list */}
        <Text style={s.listTitle}>EVERY ROUND</Text>
        <View style={s.roundList}>
          {filtered.map((round, i) => {
            const val = getValue(round, metricKey)
            const prevVal = filtered[i + 1] ? getValue(filtered[i + 1], metricKey) : null
            const delta = prevVal !== null ? val - prevVal : null
            const better = delta !== null ? (lower_better ? delta < 0 : delta > 0) : null
            const d = new Date(round.date)
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
            const yearStr = d.getFullYear()

            return (
              <View key={round.id} style={[s.roundRow, i < filtered.length - 1 && s.roundRowBorder]}>
                <View style={[s.roundDot, { backgroundColor: better === null ? C.ink3 : better ? C.fairway : C.errorRed }]} />
                <View style={s.roundInfo}>
                  <Text style={s.roundCourse}>{round.course_name || 'Unknown course'}</Text>
                  <Text style={s.roundDate}>{dateStr} · {yearStr}</Text>
                </View>
                {delta !== null && (
                  <Text style={[s.roundDelta, { color: better ? C.fairway : C.errorRed }]}>
                    {better ? '↓' : '↑'}{Math.abs(delta).toFixed(1)}
                  </Text>
                )}
                <Text style={s.roundValue}>{val > 0 ? val : '—'}</Text>
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
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink1, flex: 1, textAlign: 'center' },
  yearPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.cardBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border },
  yearPillText: { fontFamily: F.sansMedium, fontSize: 12, color: C.ink1 },

  container: { padding: 20 },
  avgEyebrow: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 4 },
  avgRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  avgValue: { fontFamily: F.serifBold, fontSize: 64, color: C.ink1, lineHeight: 70 },
  avgUnit: { fontFamily: F.sans, fontSize: 16, color: C.ink3 },
  avgSub: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginBottom: 20, letterSpacing: 0.5 },

  chartWrap: { backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 28, overflow: 'hidden' },

  listTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 12 },
  roundList: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  roundRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  roundRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  roundDot: { width: 8, height: 8, borderRadius: 4 },
  roundInfo: { flex: 1 },
  roundCourse: { fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  roundDate: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2, letterSpacing: 0.5 },
  roundDelta: { fontFamily: F.mono, fontSize: 12 },
  roundValue: { fontFamily: F.serifBold, fontSize: 28, color: C.ink1, minWidth: 40, textAlign: 'right' },
})