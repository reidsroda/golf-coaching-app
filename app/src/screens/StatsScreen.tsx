import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image, ImageBackground
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')
const CARD_IMAGE = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335687/CardImage_howewh.jpg' }
const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

// Trend bg colors (C.fairway=#2F5A3E, C.errorRed=#B14B3A)
const TREND_GREEN = 'rgba(47,90,62,0.22)'
const TREND_RED   = 'rgba(177,75,58,0.22)'

type Round = {
  id: string
  total_score: number
  total_putts: number
  fairways_hit: number
  gir: number
  penalties: number
  holes: number
  date: string
  course_name: string
}

const PAR = 72
const FAIRWAY_TOTAL = 14

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

export default function StatsScreen({ navigation }: any) {
  const [rounds, setRounds] = useState<Round[]>([])
  const [year, setYear] = useState<number | 'all'>(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState<number[]>([])

  useEffect(() => { loadRounds() }, [year])

  async function loadRounds() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let query = supabase
      .from('rounds')
      .select('id, total_score, total_putts, fairways_hit, gir, penalties, holes, date, course_name')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (year !== 'all') {
      query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
    }
    const { data } = await query
    if (!data) return
    setRounds(data)

    const { data: allRounds } = await supabase
      .from('rounds')
      .select('date')
      .eq('user_id', user.id)
    if (allRounds) {
      const years = [...new Set(allRounds.map(r => new Date(r.date).getFullYear()))].sort((a, b) => b - a)
      setAvailableYears(years)
    }
  }

  const base = rounds.filter(r => r.holes === 18).length > 0
    ? rounds.filter(r => r.holes === 18) : rounds

  const last5 = base.slice(0, 5)
  const seasonAvg = {
    score: avg(base.map(r => r.total_score)),
    putts: avg(base.map(r => r.total_putts)),
    fairways: avg(base.map(r => r.fairways_hit)),
    gir: avg(base.map(r => r.gir)),
    penalties: avg(base.map(r => r.penalties)),
  }
  const last5Avg = {
    score: avg(last5.map(r => r.total_score)),
    putts: avg(last5.map(r => r.total_putts)),
    fairways: avg(last5.map(r => r.fairways_hit)),
    gir: avg(last5.map(r => r.gir)),
    penalties: avg(last5.map(r => r.penalties)),
  }

  const scoreDiff = seasonAvg.score > 0 ? seasonAvg.score - PAR : null
  const last5Diff = last5Avg.score > 0 ? last5Avg.score - seasonAvg.score : null

  const yearLabel = year === 'all' ? 'All time' : `${year}`
  function cycleYear() {
    if (year === 'all') {
      setYear(availableYears[0] || new Date().getFullYear())
    } else {
      const idx = availableYears.indexOf(year as number)
      if (idx === availableYears.length - 1) setYear('all')
      else setYear(availableYears[idx + 1] || 'all')
    }
  }

  const metricCards = [
    {
      key: 'putts', label: 'PUTTS', value: seasonAvg.putts, last5: last5Avg.putts,
      format: (v: number) => v.toFixed(1), lower_better: true,
    },
    {
      key: 'fairways', label: 'FAIRWAYS', value: (seasonAvg.fairways / FAIRWAY_TOTAL) * 100,
      last5: (last5Avg.fairways / FAIRWAY_TOTAL) * 100,
      format: (v: number) => `${v.toFixed(0)}%`, lower_better: false,
    },
    {
      key: 'gir', label: 'GREENS', value: seasonAvg.gir, last5: last5Avg.gir,
      format: (v: number) => v.toFixed(1), lower_better: false,
    },
    {
      key: 'birdies', label: 'BIRDIES', value: 0, last5: 0,
      format: (v: number) => v.toFixed(1), lower_better: false,
    },
    {
      key: 'doubles', label: 'DOUBLE\nBOGEY+', value: 0, last5: 0,
      format: (v: number) => v.toFixed(1), lower_better: true,
    },
    {
      key: 'penalties', label: 'PENALTIES', value: seasonAvg.penalties, last5: last5Avg.penalties,
      format: (v: number) => v.toFixed(1), lower_better: true,
    },
  ]

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.eyebrow}>STATS</Text>
          <TouchableOpacity style={s.yearPill} onPress={cycleYear}>
            <Text style={s.yearPillText}>{yearLabel}</Text>
            <Ionicons name="chevron-down" size={12} color={C.ink2} />
          </TouchableOpacity>
        </View>

        {/* Hero score card */}
        {seasonAvg.score > 0 && (
          <TouchableOpacity
            style={s.heroCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('AllRounds', { rounds })}
          >
            <Image source={CARD_IMAGE} style={s.heroBg} resizeMode="cover" />
            <View style={s.heroOverlay} />
            <View style={s.heroContent}>
              <Text style={s.heroEyebrow}>SEASON AVERAGE · TO PAR</Text>
              <Text style={s.heroScore}>
                {scoreDiff !== null ? (scoreDiff >= 0 ? `+${scoreDiff.toFixed(1)}` : scoreDiff.toFixed(1)) : '—'}
              </Text>
              {last5Diff !== null && (
                <View style={s.heroBadge}>
                  <Ionicons name={last5Diff < 0 ? 'arrow-down' : 'arrow-up'} size={11} color={C.onDark} />
                  <Text style={s.heroBadgeText}>{Math.abs(last5Diff).toFixed(1)} · LAST 5</Text>
                </View>
              )}
              <Text style={s.heroRoundsHint}>Tap to see all rounds</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" style={s.heroArrow} />
          </TouchableOpacity>
        )}

        {/* Season averages grid */}
        {base.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>SEASON AVERAGES</Text>
              <Text style={s.sectionSub}>VS YOUR LAST 5</Text>
            </View>
            <Text style={s.sectionHint}>Tap any card for its full trend</Text>

            <View style={s.metricsGrid}>
              {metricCards.map((m) => {
                const diff = m.last5 - m.value
                const hasTrend = m.value > 0 && m.last5 > 0
                const better = m.lower_better ? diff < 0 : diff > 0
                const diffColor = better ? C.fairway : C.errorRed
                const tileBg = hasTrend ? (better ? TREND_GREEN : TREND_RED) : C.cardBg
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[s.metricCard, { backgroundColor: tileBg }]}
                    onPress={() => navigation.navigate('MetricDetail', {
                      metricKey: m.key, metricLabel: m.label, rounds, lower_better: m.lower_better
                    })}
                    activeOpacity={0.75}
                  >
                    <Text style={s.metricLabel}>{m.label}</Text>
                    <View style={s.metricValueRow}>
                      <Text style={s.metricValue}>{m.value > 0 ? m.format(m.value) : '—'}</Text>
                      <Ionicons name="chevron-forward" size={12} color={C.ink3} />
                    </View>
                    {hasTrend && (
                      <Text style={[s.metricDiff, { color: diffColor }]}>
                        {better ? '↓' : '↑'}{Math.abs(diff).toFixed(1)} last 5
                      </Text>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={s.trendLegend}>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.fairway }]} /><Text style={s.legendText}>Trending better last 5</Text></View>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.errorRed }]} /><Text style={s.legendText}>Trending worse</Text></View>
            </View>
          </>
        )}

        {/* Season heatmap CTA */}
        <TouchableOpacity style={s.ctaCard} onPress={() => navigation.navigate('Heatmap', { rounds })} activeOpacity={0.85}>
          <View style={s.ctaSwatches}>
            {['#2F5A3E','#5A8C6A','#2F5A3E','#C97A5C','#B14B3A','#C97A5C'].map((c, i) => (
              <View key={i} style={[s.ctaSwatch, { backgroundColor: c }]} />
            ))}
          </View>
          <View style={s.ctaText}>
            <Text style={s.ctaTitle}>Season heatmap</Text>
            <Text style={s.ctaSub}>See where your game runs hot &amp; cold</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.ink3} />
        </TouchableOpacity>

        {/* Spider chart CTA */}
        <TouchableOpacity style={s.ctaCard} onPress={() => navigation.navigate('SpiderChart', { rounds })} activeOpacity={0.85}>
          <View style={s.ctaIconWrap}>
            <Ionicons name="radio-outline" size={28} color={C.ink2} />
          </View>
          <View style={s.ctaText}>
            <Text style={s.ctaTitle}>Spider chart</Text>
            <Text style={s.ctaSub}>See how your game compares to certain handicaps</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.ink3} />
        </TouchableOpacity>

        {rounds.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>Log rounds to see your stats</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.45, resizeMode: 'cover' },
  scroll: { flex: 1 },
  container: { padding: 20, paddingTop: 64 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3 },
  yearPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.cardBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  yearPillText: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink1 },

  heroCard: { borderRadius: 16, overflow: 'hidden', height: 180, marginBottom: 24, position: 'relative' },
  heroBg: { position: 'absolute', width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,50,30,0.65)' },
  heroContent: { padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroEyebrow: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(241,236,224,0.6)', marginBottom: 4, textAlign: 'center' },
  heroScore: { fontFamily: F.serifBold, fontSize: 56, color: C.onDark, lineHeight: 62, textAlign: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', alignSelf: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  heroBadgeText: { fontFamily: F.sansBold, fontSize: 11, color: C.onDark },
  heroRoundsHint: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(241,236,224,0.45)', marginTop: 10, textAlign: 'center' },
  heroArrow: { position: 'absolute', right: 16, top: '50%' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3 },
  sectionSub: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.ink3 },
  sectionHint: { fontFamily: F.sans, fontSize: 12, color: C.ink3, fontStyle: 'italic', marginBottom: 14 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: (width - 50) / 2, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: C.border,
  },
  metricLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 6 },
  metricValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricValue: { fontFamily: F.serifBold, fontSize: 28, color: C.ink1 },
  metricDiff: { fontFamily: F.mono, fontSize: 11, marginTop: 6 },

  trendLegend: { flexDirection: 'row', gap: 16, marginTop: 12, marginBottom: 20, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: F.sans, fontSize: 12, color: C.ink2 },

  ctaCard: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
  },
  ctaSwatches: { flexDirection: 'row', flexWrap: 'wrap', width: 44, gap: 3 },
  ctaSwatch: { width: 18, height: 18, borderRadius: 4 },
  ctaIconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: C.insetBg, borderRadius: 10 },
  ctaText: { flex: 1 },
  ctaTitle: { fontFamily: F.serifBoldItalic, fontSize: 16, color: C.ink1 },
  ctaSub: { fontFamily: F.sans, fontSize: 12, color: C.ink2, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: F.sans, fontSize: 15, color: C.ink3 },
})
