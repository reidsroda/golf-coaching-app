import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ImageBackground, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

const PAR = 72

// Scorecard dimensions
const LABEL_W = 56   // fixed left column width
const CELL_W  = 36   // each data cell width
const ROW_H   = 40   // row height

type HoleScore = {
  hole_number: number
  score: number
  putts: number
  fairway_hit: boolean
  gir: boolean
  penalties: number
}

type CourseHole = {
  hole_number: number
  par: number
}

type Col = {
  key: string
  label: string
  par: number | null
  score: number | null
  type: 'hole' | 'total' | 'grandTotal'
}

function scoreBg(score: number, par: number): string {
  const d = score - par
  if (d <= -2) return '#1E4530'
  if (d === -1) return C.fairway
  if (d === 0) return 'transparent'
  if (d === 1) return C.flagYellow
  return C.errorRed
}

function scoreTextCol(score: number, par: number): string {
  const d = score - par
  if (d <= -1) return '#FFFFFF'
  if (d === 0) return C.ink1
  if (d === 1) return C.ink1
  return '#FFFFFF'
}

// ─── Horizontal scorecard ──────────────────────────────────
function HorizontalScorecard({ holeScores, courseHoles, holesPlayed }: {
  holeScores: HoleScore[]
  courseHoles: CourseHole[]
  holesPlayed: number
}) {
  if (holeScores.length === 0) {
    return (
      <View style={sc.noData}>
        <Text style={sc.noDataText}>Hole-by-hole scores not available for this round</Text>
      </View>
    )
  }

  function getPar(h: number): number | null {
    return courseHoles.find(c => c.hole_number === h)?.par ?? null
  }
  function getScore(h: number): number | null {
    return holeScores.find(s => s.hole_number === h)?.score ?? null
  }

  // Build column list
  const cols: Col[] = []

  // Front 9
  for (let h = 1; h <= Math.min(9, holesPlayed); h++) {
    cols.push({ key: `h${h}`, label: `${h}`, par: getPar(h), score: getScore(h), type: 'hole' })
  }

  const front9Par   = cols.reduce((s, c) => s + (c.par ?? 0), 0)
  const front9Score = cols.reduce((s, c) => s + (c.score ?? 0), 0)
  cols.push({ key: 'out', label: 'OUT', par: front9Par || null, score: front9Score || null, type: 'total' })

  // Back 9
  if (holesPlayed === 18) {
    const back9Cols: Col[] = []
    for (let h = 10; h <= 18; h++) {
      back9Cols.push({ key: `h${h}`, label: `${h}`, par: getPar(h), score: getScore(h), type: 'hole' })
    }
    const back9Par   = back9Cols.reduce((s, c) => s + (c.par ?? 0), 0)
    const back9Score = back9Cols.reduce((s, c) => s + (c.score ?? 0), 0)
    cols.push(...back9Cols)
    cols.push({ key: 'in',  label: 'IN',  par: back9Par || null,  score: back9Score || null,  type: 'total' })
    cols.push({
      key: 'tot', label: 'TOT',
      par: (front9Par + back9Par) || null,
      score: (front9Score + back9Score) || null,
      type: 'grandTotal',
    })
  }

  const isSub = (col: Col) => col.type === 'total' || col.type === 'grandTotal'

  // Three rows: hole labels, par, score
  const rows: Array<{
    label: string
    getValue: (col: Col) => string | number
    colored?: boolean
  }> = [
    { label: 'PAR',   getValue: c => c.par   != null ? c.par   : '—' },
    { label: 'SCORE', getValue: c => c.score != null ? c.score : '—', colored: true },
  ]

  return (
    <View style={sc.card}>
      <Text style={sc.title}>SCORECARD</Text>

      <View style={sc.tableWrap}>
        {/* Fixed left label column */}
        <View style={sc.labelCol}>
          {/* Header spacer */}
          <View style={[sc.cell, sc.headerCell]}>
            <Text style={sc.headerLabel}>HOLE</Text>
          </View>
          {rows.map(row => (
            <View key={row.label} style={sc.cell}>
              <Text style={sc.rowLabel}>{row.label}</Text>
            </View>
          ))}
        </View>

        {/* Scrollable data columns */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          bounces={false}
        >
          <View>
            {/* Hole numbers header row */}
            <View style={[sc.dataRow, sc.headerDataRow]}>
              {cols.map(col => (
                <View key={col.key} style={[sc.dataCell, isSub(col) && sc.subCell]}>
                  <Text style={[sc.headerNum, isSub(col) && sc.subHeaderNum]}>{col.label}</Text>
                </View>
              ))}
            </View>

            {rows.map(row => (
              <View key={row.label} style={sc.dataRow}>
                {cols.map(col => {
                  const val = row.getValue(col)
                  const isHoleScore = row.colored && col.type === 'hole'
                    && typeof col.score === 'number' && typeof col.par === 'number'
                  const bg = isHoleScore ? scoreBg(col.score!, col.par!) : 'transparent'
                  const textColor = isHoleScore ? scoreTextCol(col.score!, col.par!) : C.ink1

                  return (
                    <View
                      key={col.key}
                      style={[sc.dataCell, isSub(col) && sc.subCell]}
                    >
                      <View style={[
                        sc.scoreInner,
                        bg !== 'transparent' && { backgroundColor: bg },
                      ]}>
                        <Text style={[
                          sc.dataText,
                          isSub(col) && sc.subDataText,
                          row.colored && { color: textColor },
                        ]}>
                          {val}
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', paddingTop: 16, paddingBottom: 4,
  },
  title: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, paddingHorizontal: 16, marginBottom: 8 },
  tableWrap: { flexDirection: 'row' },

  // Fixed left column
  labelCol: { width: LABEL_W, borderRightWidth: 1, borderRightColor: C.hairline },
  cell: { height: ROW_H, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 12 },
  headerCell: { backgroundColor: C.insetBg, borderBottomWidth: 1, borderBottomColor: C.hairline },
  headerLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.ink3 },
  rowLabel: { fontFamily: F.mono, fontSize: 11, color: C.ink2 },

  // Data columns
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.hairline },
  headerDataRow: { backgroundColor: C.insetBg },
  dataCell: { width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center' },
  subCell: { width: CELL_W + 8, backgroundColor: 'rgba(30,42,36,0.06)' },
  headerNum: { fontFamily: F.mono, fontSize: 11, color: C.ink2 },
  subHeaderNum: { fontFamily: F.sansBold, fontSize: 10, color: C.ink1 },
  scoreInner: { width: 28, height: 26, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  dataText: { fontFamily: F.sans, fontSize: 13, color: C.ink1, textAlign: 'center' },
  subDataText: { fontFamily: F.sansBold, fontSize: 13 },

  noData: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  noDataText: { fontFamily: F.sans, fontSize: 14, color: C.ink3, textAlign: 'center' },
})

// ─── Screen ─────────────────────────────────────────────────
export default function RoundDetailScreen({ route, navigation }: any) {
  const { round } = route.params
  const [holeScores, setHoleScores] = useState<HoleScore[]>([])
  const [courseHoles, setCourseHoles] = useState<CourseHole[]>([])
  const [loading, setLoading] = useState(true)

  const par = PAR
  const score = round.total_score || 0
  const diff = score - par
  const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`
  const isOver = diff > 0

  const dateStr = new Date(round.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  useEffect(() => {
    async function load() {
      const { data: fullRound } = await supabase
        .from('rounds')
        .select('tee_set_id')
        .eq('id', round.id)
        .single()

      const { data: holes } = await supabase
        .from('holes')
        .select('hole_number, score, putts, fairway_hit, gir, penalties')
        .eq('round_id', round.id)
        .order('hole_number')
      setHoleScores(holes || [])

      if (fullRound?.tee_set_id) {
        const { data: choles } = await supabase
          .from('course_holes')
          .select('hole_number, par')
          .eq('tee_set_id', fullRound.tee_set_id)
          .order('hole_number')
          .limit(round.holes || 18)
        setCourseHoles(choles || [])
      }

      setLoading(false)
    }
    load()
  }, [round.id])

  const stats = [
    { label: 'Putts',     value: round.total_putts  ?? '—', sub: 'total' },
    { label: 'Fairways',  value: round.fairways_hit ?? '—', sub: `of ${round.holes === 9 ? 7 : 14}` },
    { label: 'GIR',       value: round.gir          ?? '—', sub: `of ${round.holes}` },
    { label: 'Penalties', value: round.penalties    ?? '—', sub: 'total' },
  ]

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Round</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.eyebrow}>{(round.course_name || 'UNKNOWN COURSE').toUpperCase()}</Text>
        <Text style={s.date}>{dateStr} · {round.holes} holes</Text>

        {/* Score hero */}
        <View style={s.scoreHero}>
          <View>
            <Text style={s.scoreLabel}>TOTAL SCORE</Text>
            <Text style={[s.scoreBig, { color: isOver ? C.errorRed : C.fairway }]}>
              {score || '—'}
            </Text>
            <Text style={s.scorePar}>vs par {par}</Text>
          </View>
          {score > 0 && (
            <View style={[s.diffPill, isOver ? s.diffPillOver : s.diffPillUnder]}>
              <Text style={[s.diffText, { color: isOver ? C.errorRed : C.fairway }]}>{diffStr}</Text>
            </View>
          )}
        </View>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          {stats.map(({ label, value, sub }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statValue}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={s.statSub}>{sub}</Text>
            </View>
          ))}
        </View>

        {/* Scorecard */}
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={C.fairway} />
          </View>
        ) : (
          <HorizontalScorecard
            holeScores={holeScores}
            courseHoles={courseHoles}
            holesPlayed={round.holes || 18}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 17, color: C.ink1 },
  container: { padding: 24 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 4 },
  date: { fontFamily: F.sansMedium, fontSize: 16, color: C.ink1, marginBottom: 24 },

  scoreHero: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.cardBg, borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  scoreLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 4 },
  scoreBig: { fontFamily: F.serifBold, fontSize: 72, lineHeight: 78 },
  scorePar: { fontFamily: F.mono, fontSize: 12, color: C.ink3, marginTop: 4 },
  diffPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30 },
  diffPillOver: { backgroundColor: '#FBE8E6' },
  diffPillUnder: { backgroundColor: '#E6F4EC' },
  diffText: { fontFamily: F.serifBold, fontSize: 28 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    width: '47%', backgroundColor: C.cardBg, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  statValue: { fontFamily: F.serifBold, fontSize: 36, color: C.ink1, marginBottom: 4 },
  statLabel: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink1 },
  statSub: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },

  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
})
