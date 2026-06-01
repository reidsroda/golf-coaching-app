import { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  TouchableOpacity, Animated, ImageBackground
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')
const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

// ─── Radar config ─────────────────────────────────────────────
const CHART_SIZE = width - 80
const CENTER = CHART_SIZE / 2
const RADIUS = CHART_SIZE * 0.34

const AXES = [
  { key: 'gir',       label: 'GIR',       higher_better: true,  max: 100, benchmark: 33  },
  { key: 'fairways',  label: 'Fairways',  higher_better: true,  max: 100, benchmark: 42  },
  { key: 'score',     label: 'Score',     higher_better: false, max: 120, benchmark: 90  },
  { key: 'penalties', label: 'Penalties', higher_better: false, max: 6,   benchmark: 1.5 },
  { key: 'putts',     label: 'Putts',     higher_better: false, max: 44,  benchmark: 36  },
]

function radarPoint(index: number, total: number, norm: number, radius: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return { x: CENTER + radius * norm * Math.cos(angle), y: CENTER + radius * norm * Math.sin(angle) }
}

function normalize(key: string, value: number, higher_better: boolean, max: number) {
  const raw = Math.min(value / max, 1)
  return higher_better ? raw : 1 - raw
}

// ─── Heatmap helpers ──────────────────────────────────────────
const HEATMAP_METRICS = [
  { key: 'total_score',  label: 'Score',    lower_better: true  },
  { key: 'total_putts',  label: 'Putts',    lower_better: true  },
  { key: 'fairways_hit', label: 'Fairways', lower_better: false },
  { key: 'gir',          label: 'Greens',   lower_better: false },
  { key: 'penalties',    label: 'Penalties',lower_better: true  },
]

function heatColor(norm: number, lower_better: boolean): string {
  const good = lower_better ? 1 - norm : norm
  if (good > 0.75) return '#2F5A3E'
  if (good > 0.55) return '#5A8C6A'
  if (good > 0.40) return '#E5D6AD'
  if (good > 0.20) return '#C97A5C'
  return '#B14B3A'
}

// ─── Recent form bars ─────────────────────────────────────────
function RecentFormBars({ rounds }: { rounds: any[] }) {
  const last5 = rounds.slice(0, 5).reverse()
  if (!last5.length) return null
  const scores = last5.map(r => r.total_score)
  const min = Math.min(...scores), max = Math.max(...scores)
  const range = max - min || 1
  return (
    <View style={s.formBars}>
      {last5.map((r, i) => {
        const h = 12 + ((r.total_score - min) / range) * 28
        return (
          <View key={i} style={s.formBarWrap}>
            <View style={[s.formBar, { height: h, backgroundColor: i === last5.length - 1 ? C.fairway : C.bunker }]} />
          </View>
        )
      })}
    </View>
  )
}

// ─── Expandable metric row ────────────────────────────────────
function MetricRow({ label, sub, value, userAvg, history, good, color }: any) {
  const [expanded, setExpanded] = useState(false)
  const anim = useRef(new Animated.Value(0)).current

  function toggle() {
    Animated.timing(anim, { toValue: expanded ? 0 : 1, duration: 220, useNativeDriver: false }).start()
    setExpanded(!expanded)
  }

  const barW = width - 128
  const maxVal = Math.max(...history, userAvg, value) * 1.15 || 1

  return (
    <View style={s.metricWrap}>
      <TouchableOpacity style={s.metricRow} onPress={toggle} activeOpacity={0.75}>
        <View style={s.metricLeft}>
          <Text style={s.metricLabel}>{label}</Text>
          <Text style={s.metricSub}>{sub}</Text>
        </View>
        <View style={s.metricRight}>
          <Text style={[s.metricValue, { color }]}>{value.toFixed(value < 10 ? 1 : 0)}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.ink3} />
        </View>
      </TouchableOpacity>

      {/* Inline bar */}
      <View style={[s.metricBarTrack, { width: barW }]}>
        <View style={[s.metricBarFill, { width: (value / maxVal) * barW, backgroundColor: color }]} />
        <View style={[s.metricBarMarker, { left: (userAvg / maxVal) * barW }]} />
      </View>
      <View style={[s.metricBarLabels, { width: barW }]}>
        <Text style={s.metricBarLabel}>0</Text>
        {userAvg > 0 && (
          <Text style={[s.metricBarLabel, { position: 'absolute', left: Math.max(0, (userAvg / maxVal) * barW - 8) }]}>
            avg
          </Text>
        )}
      </View>

      {/* Expanded history */}
      <Animated.View style={{ maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 160] }), overflow: 'hidden' }}>
        <View style={s.historyWrap}>
          <Text style={s.historyTitle}>LAST {history.length} ROUNDS</Text>
          <View style={s.historyBars}>
            {history.map((val: number, i: number) => {
              const h = Math.max(8, (val / maxVal) * 72)
              return (
                <View key={i} style={s.historyBarWrap}>
                  <Text style={s.historyBarVal}>{val.toFixed(0)}</Text>
                  <View style={[s.historyBar, {
                    height: h,
                    backgroundColor: i === history.length - 1 ? C.fairway : C.bunker,
                    opacity: 0.5 + (i / history.length) * 0.5
                  }]} />
                </View>
              )
            })}
            <View style={s.historyBarWrap}>
              <Text style={s.historyBarVal}>{userAvg.toFixed(0)}</Text>
              <View style={[s.historyBar, { height: Math.max(8, (userAvg / maxVal) * 72), backgroundColor: C.ink3 }]} />
              <Text style={[s.historyBarLabel, { color: C.ink3 }]}>avg</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

// ─── Heatmap section ──────────────────────────────────────────
function HeatmapSection({ rounds }: { rounds: any[] }) {
  const [hmView, setHmView] = useState<'rounds' | 'months'>('rounds')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const displayRounds = rounds.slice(0, 7)
  const cellW = Math.max(38, Math.floor((width - 100) / Math.max(displayRounds.length, 1)))

  function getNorm(metric: string, value: number): number {
    const vals = rounds.map(r => r[metric] ?? 0).filter(v => v > 0)
    if (!vals.length) return 0.5
    const min = Math.min(...vals), max = Math.max(...vals)
    if (max === min) return 0.5
    return (value - min) / (max - min)
  }

  if (!displayRounds.length) return null

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.hmHeader}>
        <View>
          <Text style={s.cardEyebrow}>SEASON HEATMAP</Text>
          <Text style={s.hmSubtitle}>Where your game runs <Text style={{ fontStyle: 'italic' }}>hot &amp; cold</Text></Text>
        </View>
        <View style={s.viewToggle}>
          {(['rounds', 'months'] as const).map(v => (
            <TouchableOpacity
              key={v}
              style={[s.viewToggleBtn, hmView === v && s.viewToggleBtnActive]}
              onPress={() => setHmView(v)}
            >
              <Text style={[s.viewToggleBtnText, hmView === v && s.viewToggleBtnTextActive]}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={s.hmDesc}>Each cell is shaded against your own best and worst.</Text>

      {/* Column date headers */}
      <View style={s.hmRow}>
        <View style={s.hmLabelCell} />
        {displayRounds.map((r, i) => {
          const d = new Date(r.date)
          return (
            <View key={i} style={[s.hmColHeader, { width: cellW }]}>
              <Text style={s.hmColHeaderText}>{(d.getMonth() + 1)}/{d.getDate()}</Text>
            </View>
          )
        })}
      </View>

      {/* Metric rows */}
      {HEATMAP_METRICS.map(metric => {
        const isExpanded = expandedRow === metric.key
        return (
          <View key={metric.key}>
            <TouchableOpacity
              style={[s.hmRow, s.hmMetricRow]}
              onPress={() => setExpandedRow(isExpanded ? null : metric.key)}
              activeOpacity={0.8}
            >
              <View style={s.hmLabelCell}>
                <Text style={s.hmLabel}>{metric.label}</Text>
                <Ionicons name="chevron-forward" size={10} color={C.ink3} />
              </View>
              {displayRounds.map((r, i) => {
                const val = r[metric.key] ?? 0
                const norm = getNorm(metric.key, val)
                const bg = heatColor(norm, metric.lower_better)
                const display = metric.key === 'total_score' && val > 0
                  ? (val - 72 >= 0 ? `+${val - 72}` : `${val - 72}`)
                  : String(val)
                return (
                  <View key={i} style={[s.hmCell, { width: cellW, backgroundColor: bg }]}>
                    <Text style={s.hmCellText}>{display}</Text>
                  </View>
                )
              })}
            </TouchableOpacity>

            {/* Expanded trend */}
            {isExpanded && (
              <View style={s.hmTrend}>
                <Text style={s.hmTrendLabel}>TREND</Text>
                <View style={s.hmTrendBars}>
                  {displayRounds.slice().reverse().map((r, i) => {
                    const val = r[metric.key] ?? 0
                    const norm = getNorm(metric.key, val)
                    const good = metric.lower_better ? 1 - norm : norm
                    const h = Math.max(8, good * 56)
                    return (
                      <View key={i} style={s.hmTrendBarWrap}>
                        <Text style={s.hmTrendVal}>{val}</Text>
                        <View style={[s.hmTrendBar, { height: h, backgroundColor: heatColor(norm, metric.lower_better) }]} />
                      </View>
                    )
                  })}
                </View>
              </View>
            )}
          </View>
        )
      })}

      {/* Legend */}
      <View style={s.hmLegend}>
        <View style={s.hmLegendGrad}>
          {['#B14B3A','#C97A5C','#E5D6AD','#5A8C6A','#2F5A3E'].map((c, i) => (
            <View key={i} style={[s.hmLegendBlock, { backgroundColor: c }]} />
          ))}
        </View>
        <View style={s.hmLegendLabels}>
          <Text style={s.hmLegendText}>Worse</Text>
          <Text style={s.hmLegendText}>Better</Text>
        </View>
        <Text style={[s.hmLegendText, { textAlign: 'right', marginTop: 2 }]}>vs your own range</Text>
      </View>

      <Text style={s.hmTapHint}>› Tap any row to open its trend.</Text>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────
export default function ActivityScreen() {
  const [rounds, setRounds] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [lastRound, setLastRound] = useState<any>(null)
  const [timePeriod, setTimePeriod] = useState<'30' | '90' | 'all'>('30')

  useEffect(() => { loadStats() }, [timePeriod])

  async function loadStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('rounds')
      .select('total_score, total_putts, fairways_hit, gir, penalties, holes, date, course_name')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (timePeriod !== 'all') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - parseInt(timePeriod))
      query = query.gte('date', cutoff.toISOString().split('T')[0])
    }

    const { data } = await query
    if (!data || !data.length) return

    setRounds(data)
    setLastRound(data[0])

    const r18 = data.filter((r: any) => r.holes === 18)
    const base = r18.length > 0 ? r18 : data
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

    setStats({
      gir:       avg(base.map((r: any) => (r.gir / 18) * 100)),
      fairways:  avg(base.map((r: any) => (r.fairways_hit / 14) * 100)),
      score:     avg(base.map((r: any) => r.total_score)),
      putts:     avg(base.map((r: any) => r.total_putts)),
      penalties: avg(base.map((r: any) => r.penalties)),
      puttsRaw:  avg(base.map((r: any) => r.total_putts)),
      fairwaysRaw: avg(base.map((r: any) => r.fairways_hit)),
      girRaw:    avg(base.map((r: any) => r.gir)),
      penRaw:    avg(base.map((r: any) => r.penalties)),
      history: {
        putts:    base.slice(0, 5).reverse().map((r: any) => r.total_putts),
        fairways: base.slice(0, 5).reverse().map((r: any) => r.fairways_hit),
        gir:      base.slice(0, 5).reverse().map((r: any) => r.gir),
        penalties:base.slice(0, 5).reverse().map((r: any) => r.penalties),
        score:    base.slice(0, 5).reverse().map((r: any) => r.total_score),
      }
    })
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const r18 = rounds.filter(r => r.holes === 18)
  const base = r18.length > 0 ? r18 : rounds

  const userPoints = stats ? AXES.map((axis, i) => {
    const norm = normalize(axis.key, stats[axis.key], axis.higher_better, axis.max)
    return radarPoint(i, AXES.length, Math.min(Math.max(norm, 0), 1), RADIUS)
  }) : []

  const benchPoints = AXES.map((axis, i) => {
    const norm = normalize(axis.key, axis.benchmark, axis.higher_better, axis.max)
    return radarPoint(i, AXES.length, Math.min(Math.max(norm, 0), 1), RADIUS)
  })

  const scoreDiff = lastRound && stats ? lastRound.total_score - stats.score : null
  const lastDate = lastRound
    ? new Date(lastRound.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  const periodLabel = timePeriod === '30' ? 'Last 30 days' : timePeriod === '90' ? 'Last 90 days' : 'All time'

  const metrics = stats ? [
    { label: 'Putts',        sub: 'incl. all greens',  value: lastRound?.total_putts  ?? 0, userAvg: stats.puttsRaw,    history: stats.history.putts,    good: (lastRound?.total_putts  ?? 0) <= stats.puttsRaw    },
    { label: 'Fairways Hit', sub: 'of 14',              value: lastRound?.fairways_hit ?? 0, userAvg: stats.fairwaysRaw, history: stats.history.fairways, good: (lastRound?.fairways_hit ?? 0) >= stats.fairwaysRaw },
    { label: 'Penalties',    sub: 'OB, water, lost',    value: lastRound?.penalties    ?? 0, userAvg: stats.penRaw,     history: stats.history.penalties,good: (lastRound?.penalties    ?? 0) <= stats.penRaw      },
    { label: 'Greens in Reg',sub: 'of 18',              value: lastRound?.gir          ?? 0, userAvg: stats.girRaw,     history: stats.history.gir,      good: (lastRound?.gir          ?? 0) >= stats.girRaw      },
    { label: 'Total Score',  sub: 'last round',         value: lastRound?.total_score  ?? 0, userAvg: stats.score,      history: stats.history.score,    good: (lastRound?.total_score  ?? 0) <= stats.score       },
  ] : []

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.eyebrow}>STATS</Text>
          <TouchableOpacity
            style={s.periodPill}
            onPress={() => setTimePeriod(p => p === '30' ? '90' : p === '90' ? 'all' : '30')}
          >
            <Text style={s.periodPillText}>{periodLabel}</Text>
            <Ionicons name="chevron-down" size={12} color={C.ink2} />
          </TouchableOpacity>
        </View>

        {/* Last round hero */}
        {lastRound && stats && (
          <View style={s.heroCard}>
            <Text style={s.heroEyebrow}>LAST ROUND VS YOUR AVERAGE</Text>
            <View style={s.heroRow}>
              <View style={s.heroLeft}>
                <View style={s.heroScoreRow}>
                  <Text style={[s.heroScore, { color: scoreDiff && scoreDiff > 0 ? C.errorRed : C.fairway }]}>
                    {scoreDiff !== null && scoreDiff > 0 ? '+' : ''}{scoreDiff?.toFixed(0)}
                  </Text>
                  {scoreDiff !== null && Math.abs(scoreDiff) > 0.1 && (
                    <View style={[s.heroDiffBadge, { backgroundColor: scoreDiff > 0 ? '#FBE8E6' : '#E6F4EC' }]}>
                      <Ionicons name={scoreDiff < 0 ? 'arrow-down' : 'arrow-up'} size={11} color={scoreDiff < 0 ? C.fairway : C.errorRed} />
                      <Text style={[s.heroDiffText, { color: scoreDiff < 0 ? C.fairway : C.errorRed }]}>
                        {Math.abs(scoreDiff).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={s.heroVsAvg}>vs your average</Text>
                <Text style={s.heroMeta}>{lastRound.course_name} · Par 72 · {lastDate}</Text>
              </View>
              <View style={s.heroRight}>
                <RecentFormBars rounds={rounds} />
                <Text style={s.recentFormLabel}>RECENT FORM</Text>
              </View>
            </View>
          </View>
        )}

        {/* Radar chart */}
        <View style={s.card}>
          <Text style={s.cardEyebrow}>PERFORMANCE RADAR</Text>
          <Text style={s.cardSub}>vs. average amateur golfer</Text>
          <View style={s.legendRow}>
            <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.fairway }]} /><Text style={s.legendText}>Your game</Text></View>
            <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.teeBlue }]} /><Text style={s.legendText}>Amateur avg</Text></View>
          </View>
          {stats ? (
            <Svg width={CHART_SIZE} height={CHART_SIZE} style={{ alignSelf: 'center' }}>
              {[0.25, 0.5, 0.75, 1.0].map(level => (
                <Polygon key={level} points={AXES.map((_, i) => { const p = radarPoint(i, AXES.length, level, RADIUS); return `${p.x},${p.y}` }).join(' ')} fill="none" stroke={C.border} strokeWidth="1" />
              ))}
              {AXES.map((_, i) => { const o = radarPoint(i, AXES.length, 1, RADIUS); return <Line key={i} x1={CENTER} y1={CENTER} x2={o.x} y2={o.y} stroke={C.border} strokeWidth="1" /> })}
              <Polygon points={benchPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={C.teeBlue} fillOpacity={0.15} stroke={C.teeBlue} strokeWidth={1.5} />
              <Polygon points={userPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={C.fairway} fillOpacity={0.2} stroke={C.fairway} strokeWidth={2} />
              {userPoints.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={4} fill={C.fairway} />)}
              {AXES.map((axis, i) => { const lp = radarPoint(i, AXES.length, 1.3, RADIUS); return <SvgText key={i} x={lp.x} y={lp.y} textAnchor="middle" fontSize="11" fill={C.ink2} fontWeight="500">{axis.label}</SvgText> })}
            </Svg>
          ) : (
            <View style={s.emptyChart}><Text style={s.emptyText}>Log rounds to see your radar</Text></View>
          )}
        </View>

        {/* Stat breakdown */}
        {stats && metrics.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardEyebrow}>STAT BREAKDOWN</Text>
            <View style={[s.legendRow, { marginBottom: 4 }]}>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.fairway }]} /><Text style={s.legendText}>Better than your average</Text></View>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.errorRed }]} /><Text style={s.legendText}>Worse</Text></View>
            </View>
            {metrics.map((m, i) => (
              <MetricRow key={i} {...m} color={m.good ? C.fairway : C.errorRed} />
            ))}
          </View>
        )}

        {/* Heatmap embedded section */}
        <HeatmapSection rounds={rounds} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  container: { padding: 20, paddingTop: 64, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3 },
  periodPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.cardBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  periodPillText: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink1 },

  heroCard: { backgroundColor: C.cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  heroEyebrow: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 12 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroLeft: { flex: 1 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  heroScore: { fontFamily: F.serifBold, fontSize: 64, lineHeight: 70 },
  heroDiffBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  heroDiffText: { fontFamily: F.sansBold, fontSize: 12 },
  heroVsAvg: { fontFamily: F.sans, fontSize: 13, color: C.ink2, marginBottom: 6 },
  heroMeta: { fontFamily: F.mono, fontSize: 11, color: C.ink3 },
  heroRight: { alignItems: 'flex-end', gap: 6 },
  formBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 44 },
  formBarWrap: { justifyContent: 'flex-end' },
  formBar: { width: 8, borderRadius: 3 },
  recentFormLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.ink3 },

  card: { backgroundColor: C.cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  cardEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 4 },
  cardSub: { fontFamily: F.sansMedium, fontSize: 13, color: C.fairway, marginBottom: 14 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: F.sans, fontSize: 12, color: C.ink2 },
  emptyChart: { height: 180, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: F.sans, fontSize: 14, color: C.ink3 },

  metricWrap: { borderTopWidth: 1, borderTopColor: C.hairline, paddingTop: 14, marginTop: 14 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  metricLeft: { flex: 1 },
  metricLabel: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },
  metricSub: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },
  metricRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricValue: { fontFamily: F.serifBold, fontSize: 22 },
  metricBarTrack: { height: 6, backgroundColor: C.insetBg, borderRadius: 3, position: 'relative', overflow: 'visible' },
  metricBarFill: { height: 6, borderRadius: 3 },
  metricBarMarker: { position: 'absolute', top: -4, width: 2, height: 14, backgroundColor: C.ink3, borderRadius: 1 },
  metricBarLabels: { flexDirection: 'row', marginTop: 4, position: 'relative', height: 14 },
  metricBarLabel: { fontFamily: F.mono, fontSize: 9, color: C.ink3 },
  historyWrap: { paddingTop: 16 },
  historyTitle: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 12 },
  historyBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 96 },
  historyBarWrap: { flex: 1, alignItems: 'center', gap: 4 },
  historyBarVal: { fontFamily: F.mono, fontSize: 10, color: C.ink2 },
  historyBar: { width: '100%', borderRadius: 4, minHeight: 8 },
  historyBarLabel: { fontFamily: F.mono, fontSize: 9 },

  // Heatmap
  hmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  hmSubtitle: { fontFamily: F.serifBold, fontSize: 15, color: C.ink1, marginTop: 2 },
  hmDesc: { fontFamily: F.sans, fontSize: 12, color: C.ink2, marginBottom: 16 },
  viewToggle: { flexDirection: 'row', backgroundColor: C.insetBg, borderRadius: 20, padding: 3, borderWidth: 1, borderColor: C.border },
  viewToggleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 17 },
  viewToggleBtnActive: { backgroundColor: C.cardBg },
  viewToggleBtnText: { fontFamily: F.sansMedium, fontSize: 12, color: C.ink3 },
  viewToggleBtnTextActive: { color: C.ink1 },
  hmRow: { flexDirection: 'row', alignItems: 'center' },
  hmMetricRow: { borderTopWidth: 1, borderTopColor: C.hairline },
  hmLabelCell: { width: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8, paddingVertical: 11 },
  hmLabel: { fontFamily: F.sansMedium, fontSize: 12, color: C.ink1 },
  hmColHeader: { alignItems: 'center', paddingVertical: 8 },
  hmColHeaderText: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  hmCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  hmCellText: { fontFamily: F.sansBold, fontSize: 12, color: '#F1ECE0' },
  hmTrend: { backgroundColor: C.insetBg, padding: 14, borderTopWidth: 1, borderTopColor: C.hairline },
  hmTrendLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 10 },
  hmTrendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 72 },
  hmTrendBarWrap: { flex: 1, alignItems: 'center', gap: 4 },
  hmTrendVal: { fontFamily: F.mono, fontSize: 10, color: C.ink2 },
  hmTrendBar: { width: '100%', borderRadius: 4, minHeight: 8 },
  hmLegend: { marginTop: 16, gap: 4 },
  hmLegendGrad: { flexDirection: 'row', gap: 3 },
  hmLegendBlock: { flex: 1, height: 7, borderRadius: 2 },
  hmLegendLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  hmLegendText: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  hmTapHint: { fontFamily: F.sans, fontSize: 12, color: C.ink3, fontStyle: 'italic', marginTop: 12 },
})