import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')

type Round = {
  id: string; total_score: number; total_putts: number
  fairways_hit: number; gir: number; penalties: number
  holes: number; date: string; course_name: string
}

const METRICS = [
  { key: 'total_score',  label: 'Score',     lower_better: true,  format: (v: number) => v > 72 ? `+${v - 72}` : v === 72 ? 'E' : `${v - 72}` },
  { key: 'total_putts',  label: 'Putts',     lower_better: true,  format: (v: number) => `${v}` },
  { key: 'fairways_hit', label: 'Fairways',  lower_better: false, format: (v: number) => `${v}` },
  { key: 'gir',          label: 'Greens',    lower_better: false, format: (v: number) => `${v}` },
  { key: 'birdies',      label: 'Birdies',   lower_better: false, format: (v: number) => `${v}` },
  { key: 'doubles',      label: 'Doubles+',  lower_better: true,  format: (v: number) => `${v}` },
  { key: 'penalties',    label: 'Penalties', lower_better: true,  format: (v: number) => `${v}` },
]

function heatColor(norm: number, lower_better: boolean): string {
  const good = lower_better ? 1 - norm : norm
  if (good > 0.75) return '#2F5A3E'
  if (good > 0.55) return '#5A8C6A'
  if (good > 0.40) return '#D6CCAA'
  if (good > 0.20) return '#C97A5C'
  return '#B14B3A'
}

function getNorm(rounds: any[], key: string, value: number): number {
  const vals = rounds.map(r => r[key] ?? 0).filter(v => v > 0)
  if (!vals.length) return 0.5
  const min = Math.min(...vals), max = Math.max(...vals)
  if (max === min) return 0.5
  return (value - min) / (max - min)
}

function getValue(round: any, key: string): number {
  return round[key] ?? 0
}

export default function HeatmapScreen({ route, navigation }: any) {
  const { rounds } = route.params as { rounds: Round[] }
  const [view, setView] = useState<'rounds' | 'months'>('rounds')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const base = rounds.filter(r => r.holes === 18).length > 0
    ? rounds.filter(r => r.holes === 18) : rounds

  // Rounds view: last 7 rounds as columns
  const displayRounds = base.slice(0, 14)

  // Months view: group by month
  const monthGroups = (() => {
    const groups: { [key: string]: Round[] } = {}
    base.forEach(r => {
      const d = new Date(r.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7)
  })()

  // Cols for rounds view
  const LABEL_W = 76
  const CELL_W = Math.floor((width - 40 - LABEL_W) / Math.min(displayRounds.length, 7))

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <View style={s.viewToggle}>
          {(['rounds', 'months'] as const).map(v => (
            <TouchableOpacity key={v} style={[s.toggleBtn, view === v && s.toggleBtnActive]} onPress={() => setView(v)}>
              <Text style={[s.toggleBtnText, view === v && s.toggleBtnTextActive]}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.eyebrow}>SEASON</Text>
        <Text style={s.title}>Where your game runs{'\n'}<Text style={s.titleItalic}>hot &amp; cold</Text></Text>
        <Text style={s.subtitle}>Each cell is shaded against your own best and worst — scan a row to feel a streak.</Text>

        {/* Grid */}
        <View style={s.gridCard}>
          {view === 'rounds' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Date headers */}
                <View style={s.headerRow}>
                  <View style={[s.labelCell, { width: LABEL_W }]} />
                  {displayRounds.map((r, i) => {
                    const d = new Date(r.date)
                    return (
                      <View key={i} style={[s.colHeader, { width: Math.max(CELL_W, 44) }]}>
                        <Text style={s.colHeaderText}>{(d.getMonth() + 1)}/{d.getDate()}</Text>
                      </View>
                    )
                  })}
                </View>

                {/* Metric rows */}
                {METRICS.map(metric => {
                  const isExpanded = expandedRow === metric.key
                  return (
                    <View key={metric.key}>
                      <TouchableOpacity
                        style={[s.metricRow, { borderTopWidth: 1, borderTopColor: C.hairline }]}
                        onPress={() => setExpandedRow(isExpanded ? null : metric.key)}
                        activeOpacity={0.8}
                      >
                        <View style={[s.labelCell, { width: LABEL_W }]}>
                          <Text style={s.metricLabel}>{metric.label}</Text>
                          <Ionicons name="chevron-forward" size={10} color={C.ink3} />
                        </View>
                        {displayRounds.map((r, i) => {
                          const val = getValue(r, metric.key)
                          const norm = getNorm(displayRounds, metric.key, val)
                          const bg = heatColor(norm, metric.lower_better)
                          return (
                            <View key={i} style={[s.cell, { width: Math.max(CELL_W, 44), backgroundColor: bg }]}>
                              <Text style={s.cellText}>{val > 0 ? metric.format(val) : '—'}</Text>
                            </View>
                          )
                        })}
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={s.trendRow}>
                          <Text style={s.trendLabel}>TREND</Text>
                          <View style={s.trendBars}>
                            {[...displayRounds].reverse().map((r, i) => {
                              const val = getValue(r, metric.key)
                              const norm = getNorm(displayRounds, metric.key, val)
                              const good = metric.lower_better ? 1 - norm : norm
                              const h = Math.max(8, good * 52)
                              return (
                                <View key={i} style={s.trendBarWrap}>
                                  <Text style={s.trendVal}>{val > 0 ? val : '—'}</Text>
                                  <View style={[s.trendBar, { height: h, backgroundColor: heatColor(norm, metric.lower_better) }]} />
                                </View>
                              )
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          ) : (
            // Months view
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={s.headerRow}>
                  <View style={[s.labelCell, { width: LABEL_W }]} />
                  {monthGroups.map(([key], i) => {
                    const [yr, mo] = key.split('-')
                    const monthName = new Date(parseInt(yr), parseInt(mo) - 1).toLocaleDateString('en-US', { month: 'short' })
                    return (
                      <View key={i} style={[s.colHeader, { width: 52 }]}>
                        <Text style={s.colHeaderText}>{monthName}</Text>
                        <Text style={[s.colHeaderText, { fontSize: 8 }]}>{yr}</Text>
                      </View>
                    )
                  })}
                </View>
                {METRICS.map(metric => (
                  <View key={metric.key} style={[s.metricRow, { borderTopWidth: 1, borderTopColor: C.hairline }]}>
                    <View style={[s.labelCell, { width: LABEL_W }]}>
                      <Text style={s.metricLabel}>{metric.label}</Text>
                    </View>
                    {monthGroups.map(([key, monthRounds], i) => {
                      const vals = monthRounds.map(r => getValue(r, metric.key)).filter(v => v > 0)
                      const monthAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
                      const norm = getNorm(base, metric.key, monthAvg)
                      const bg = heatColor(norm, metric.lower_better)
                      return (
                        <View key={i} style={[s.cell, { width: 52, backgroundColor: bg }]}>
                          <Text style={s.cellText}>{monthAvg > 0 ? monthAvg.toFixed(0) : '—'}</Text>
                        </View>
                      )
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Legend */}
        <View style={s.legend}>
          <View style={s.legendGrad}>
            {['#B14B3A','#C97A5C','#D6CCAA','#5A8C6A','#2F5A3E'].map((c, i) => (
              <View key={i} style={[s.legendBlock, { backgroundColor: c }]} />
            ))}
          </View>
          <View style={s.legendLabels}>
            <Text style={s.legendText}>Worse</Text>
            <Text style={s.legendText}>Better</Text>
          </View>
          <Text style={[s.legendText, { textAlign: 'right', marginTop: 2 }]}>vs your own range</Text>
        </View>

        <Text style={s.tapHint}>› Tap any row to open its trend over time.</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  viewToggle: { flexDirection: 'row', backgroundColor: C.insetBg, borderRadius: 20, padding: 3, borderWidth: 1, borderColor: C.border },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 17 },
  toggleBtnActive: { backgroundColor: C.cardBg },
  toggleBtnText: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink3 },
  toggleBtnTextActive: { color: C.ink1 },

  container: { padding: 20, paddingTop: 24 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3, marginBottom: 8 },
  title: { fontFamily: F.serifBold, fontSize: 26, color: C.ink1, lineHeight: 32, marginBottom: 8 },
  titleItalic: { fontFamily: F.serifBoldItalic, fontSize: 26 },
  subtitle: { fontFamily: F.sans, fontSize: 13, color: C.ink2, lineHeight: 19, marginBottom: 20 },

  gridCard: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
  headerRow: { flexDirection: 'row' },
  labelCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  colHeader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  colHeaderText: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  metricRow: { flexDirection: 'row', alignItems: 'center' },
  metricLabel: { fontFamily: F.sansMedium, fontSize: 12, color: C.ink1 },
  cell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
  cellText: { fontFamily: F.sansBold, fontSize: 13, color: '#F1ECE0' },

  trendRow: { backgroundColor: C.insetBg, padding: 14, borderTopWidth: 1, borderTopColor: C.hairline },
  trendLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 10 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 68 },
  trendBarWrap: { flex: 1, alignItems: 'center', gap: 4 },
  trendVal: { fontFamily: F.mono, fontSize: 10, color: C.ink2 },
  trendBar: { width: '100%', borderRadius: 4, minHeight: 8 },

  legend: { gap: 4 },
  legendGrad: { flexDirection: 'row', gap: 3 },
  legendBlock: { flex: 1, height: 7, borderRadius: 2 },
  legendLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  legendText: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  tapHint: { fontFamily: F.sans, fontSize: 12, color: C.ink3, fontStyle: 'italic', marginTop: 14 },
})