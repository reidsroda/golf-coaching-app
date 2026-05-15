import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, F } from '../theme'

export default function RoundSummaryScreen({ route, navigation }: any) {
  const { round, tee, course, holes } = route.params
  const par = tee?.par_total || 72
  const score = round.total_score || 0
  const diff = score - par
  const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`
  const isOver = diff > 0

  const differential = tee?.course_rating && tee?.slope_rating && score > 0
    ? (((score - tee.course_rating) * 113) / tee.slope_rating).toFixed(1)
    : null

  const dateStr = new Date(round.date || Date.now()).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  const stats = [
    { label: 'Total Putts',  value: round.total_putts  ?? '—', sub: 'incl. all greens' },
    { label: 'Fairways Hit', value: round.fairways_hit ?? '—', sub: `of ${holes === 9 ? 7 : 14}` },
    { label: 'GIR',          value: round.gir          ?? '—', sub: `of ${holes}` },
    { label: 'Penalties',    value: round.penalties    ?? '—', sub: 'OB, water, lost' },
  ]

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Round saved</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Course + date */}
        <Text style={s.eyebrow}>
          {course?.name?.toUpperCase()} · {tee?.name?.toUpperCase()} TEES
        </Text>
        <Text style={s.date}>{dateStr}</Text>

        {/* Score hero */}
        <View style={s.scoreHero}>
          <View>
            <Text style={s.scoreLabel}>TOTAL SCORE</Text>
            <Text style={[s.scoreBig, isOver ? { color: C.errorRed } : { color: C.fairway }]}>
              {score || '—'}
            </Text>
            <Text style={s.scorePar}>vs par {par}</Text>
          </View>
          <View style={[s.diffPill, isOver ? s.diffPillOver : s.diffPillUnder]}>
            <Text style={[s.diffText, { color: isOver ? C.errorRed : C.fairway }]}>{diffStr}</Text>
          </View>
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

        {/* Handicap differential */}
        {differential && (
          <View style={s.diffCard}>
            <Text style={s.diffCardLabel}>HANDICAP DIFFERENTIAL</Text>
            <Text style={s.diffCardValue}>{differential}</Text>
            <Text style={s.diffCardFormula}>
              ({score} − {tee.course_rating}) × 113 ÷ {tee.slope_rating}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={s.primaryBtnText}>Back to home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('AddRound')}>
            <Text style={s.secondaryBtnText}>Start another round</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },

  container: { padding: 24 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 6 },
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

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    width: '47%', backgroundColor: C.cardBg, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  statValue: { fontFamily: F.serifBold, fontSize: 36, color: C.ink1, marginBottom: 4 },
  statLabel: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink1 },
  statSub: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },

  diffCard: {
    backgroundColor: C.fairwayDark, borderRadius: 12, padding: 20, marginBottom: 24,
  },
  diffCardLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.onDarkMuted, marginBottom: 8 },
  diffCardValue: { fontFamily: F.serifBold, fontSize: 52, color: C.onDark, marginBottom: 6 },
  diffCardFormula: { fontFamily: F.mono, fontSize: 11, color: C.onDarkMuted },

  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center',
  },
  primaryBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
  secondaryBtn: {
    backgroundColor: C.cardBg, borderRadius: 12, paddingVertical: 18, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  secondaryBtnText: { fontFamily: F.sansMedium, fontSize: 16, color: C.ink1 },
})