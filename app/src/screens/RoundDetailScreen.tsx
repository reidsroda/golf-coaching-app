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

function scoreBg(score: number, par: number): string {
  const d = score - par
  if (d <= -2) return '#1E4530'
  if (d === -1) return C.fairway
  if (d === 0) return 'transparent'
  if (d === 1) return C.flagYellow
  return C.errorRed
}

function scoreTextColor(score: number, par: number): string {
  const d = score - par
  if (d <= -1) return '#FFFFFF'
  if (d === 0) return C.ink1
  if (d === 1) return C.ink1
  return '#FFFFFF'
}

function HoleRow({
  hole, par, score, isHeader, isSub,
}: {
  hole: string | number; par: string | number; score: string | number
  isHeader?: boolean; isSub?: boolean
}) {
  const isNum = typeof score === 'number' && typeof par === 'number'
  const bg = isNum ? scoreBg(score, par) : 'transparent'
  const textC = isNum ? scoreTextColor(score, par) : (isHeader ? C.ink3 : C.ink1)

  return (
    <View style={[sc.row, isSub && sc.subRow]}>
      <Text style={[sc.holeCell, isHeader && sc.headerText, isSub && sc.subText]}>
        {hole}
      </Text>
      <Text style={[sc.parCell, isHeader && sc.headerText, isSub && sc.subText]}>
        {par}
      </Text>
      <View style={[sc.scoreWrap, isNum && bg !== 'transparent' ? { backgroundColor: bg, borderRadius: 6 } : null]}>
        <Text style={[sc.scoreCell, isHeader && sc.headerText, isSub && sc.subText, isNum ? { color: textC } : null]}>
          {score}
        </Text>
      </View>
    </View>
  )
}

const sc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.hairline },
  subRow: { backgroundColor: C.insetBg },
  holeCell: { width: 44, fontFamily: F.mono, fontSize: 13, color: C.ink2, textAlign: 'center' },
  parCell: { flex: 1, fontFamily: F.mono, fontSize: 13, color: C.ink2, textAlign: 'center' },
  scoreWrap: { width: 52, alignItems: 'center', paddingVertical: 3 },
  scoreCell: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink1, textAlign: 'center' },
  headerText: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.ink3 },
  subText: { fontFamily: F.sansBold, fontSize: 13 },
})

function Scorecard({ holeScores, courseHoles, holesPlayed }: {
  holeScores: HoleScore[]
  courseHoles: CourseHole[]
  holesPlayed: number
}) {
  if (holeScores.length === 0) {
    return (
      <View style={s.noHoles}>
        <Text style={s.noHolesText}>Hole-by-hole scores not available for this round</Text>
      </View>
    )
  }

  function getPar(hNum: number): number | null {
    return courseHoles.find(c => c.hole_number === hNum)?.par ?? null
  }

  function getScore(hNum: number): number | null {
    return holeScores.find(h => h.hole_number === hNum)?.score ?? null
  }

  function sum9(start: number, end: number, type: 'par' | 'score'): number {
    let total = 0
    for (let h = start; h <= end; h++) {
      const v = type === 'par' ? getPar(h) : getScore(h)
      total += v ?? 0
    }
    return total
  }

  const front9Par   = sum9(1, 9, 'par')
  const front9Score = sum9(1, 9, 'score')
  const back9Par    = sum9(10, 18, 'par')
  const back9Score  = sum9(10, 18, 'score')

  const hasPar = courseHoles.length > 0

  return (
    <View style={s.scorecardCard}>
      <Text style={s.scorecardTitle}>SCORECARD</Text>

      {/* Header */}
      <HoleRow hole="HOLE" par="PAR" score="SCORE" isHeader />

      {/* Front 9 */}
      {Array.from({ length: Math.min(9, holesPlayed) }, (_, i) => i + 1).map(h => {
        const par = getPar(h)
        const score = getScore(h)
        return (
          <HoleRow
            key={h}
            hole={h}
            par={hasPar && par != null ? par : '—'}
            score={score != null ? score : '—'}
          />
        )
      })}

      {/* Front 9 total */}
      <HoleRow
        hole="OUT"
        par={hasPar ? front9Par || '—' : '—'}
        score={front9Score || '—'}
        isSub
      />

      {/* Back 9 */}
      {holesPlayed === 18 && (
        <>
          {Array.from({ length: 9 }, (_, i) => i + 10).map(h => {
            const par = getPar(h)
            const score = getScore(h)
            return (
              <HoleRow
                key={h}
                hole={h}
                par={hasPar && par != null ? par : '—'}
                score={score != null ? score : '—'}
              />
            )
          })}
          <HoleRow
            hole="IN"
            par={hasPar ? back9Par || '—' : '—'}
            score={back9Score || '—'}
            isSub
          />
          <HoleRow
            hole="TOT"
            par={hasPar ? (front9Par + back9Par) || '—' : '—'}
            score={(front9Score + back9Score) || '—'}
            isSub
          />
        </>
      )}
    </View>
  )
}

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
      // Fetch full round for tee_set_id
      const { data: fullRound } = await supabase
        .from('rounds')
        .select('tee_set_id')
        .eq('id', round.id)
        .single()

      // Fetch hole scores
      const { data: holes } = await supabase
        .from('holes')
        .select('hole_number, score, putts, fairway_hit, gir, penalties')
        .eq('round_id', round.id)
        .order('hole_number')
      setHoleScores(holes || [])

      // Fetch par data from course_holes if tee_set_id available
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
    { label: 'Putts',    value: round.total_putts  ?? '—', sub: 'total' },
    { label: 'Fairways', value: round.fairways_hit ?? '—', sub: `of ${round.holes === 9 ? 7 : 14}` },
    { label: 'GIR',      value: round.gir          ?? '—', sub: `of ${round.holes}` },
    { label: 'Penalties',value: round.penalties    ?? '—', sub: 'total' },
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
          <Scorecard
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

  scorecardCard: {
    backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 4,
  },
  scorecardTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 12 },

  noHoles: { alignItems: 'center', paddingVertical: 32, backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  noHolesText: { fontFamily: F.sans, fontSize: 14, color: C.ink3, textAlign: 'center' },
})
