import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')

type HoleData = {
  score: number | null
  putts: number | null
  fairway_hit: boolean | null
  gir: boolean | null
  penalties: number
}

type RoundSummary = {
  total_score: number
  total_putts: number
  fairways_hit: number
  gir: number
  penalties: number
  birdies: number
  doubles: number
}

const SCORE_LABELS: Record<number, string> = {
  [-3]: 'ALBATROSS', [-2]: 'EAGLE', [-1]: 'BIRDIE',
  [0]: 'PAR', [1]: 'BOGEY', [2]: 'DOUBLE', [3]: 'TRIPLE',
}

function getScoreLabel(score: number, par: number): string {
  const diff = score - par
  if (diff <= -3) return 'ALBATROSS'
  if (diff >= 4) return `+${diff}`
  return SCORE_LABELS[diff] || `+${diff}`
}

function scoreCellColor(score: number, par: number): string {
  const diff = score - par
  if (diff <= -1) return C.fairway       // birdie or better — green
  if (diff === 0) return C.ink1          // par — dark
  if (diff === 1) return C.flagYellow    // bogey — yellow
  return C.errorRed                      // double+ — red
}

// ─── Total Score Mode ─────────────────────────────────────────
function TotalScoreMode({ round, tee, course, holes, onSave, onBack }: any) {
  const [summary, setSummary] = useState<RoundSummary>({
    total_score: 0, total_putts: 0, fairways_hit: 0,
    gir: 0, penalties: 0, birdies: 0, doubles: 0,
  })
  const [loading, setLoading] = useState(false)
  const par = tee?.par_total || 72

  function update(field: keyof RoundSummary, delta: number) {
    setSummary(prev => ({ ...prev, [field]: Math.max(0, (prev[field] as number) + delta) }))
  }

  async function handleSave() {
    setLoading(true)
    const { error } = await supabase.from('rounds').update({
      total_score: summary.total_score,
      total_putts: summary.total_putts,
      fairways_hit: summary.fairways_hit,
      gir: summary.gir,
      penalties: summary.penalties,
    }).eq('id', round.id)
    setLoading(false)
    if (!error) onSave({ ...round, ...summary })
  }

  const diff = summary.total_score - par
  const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`
  const isOver = diff > 0

  const summaryFields: { key: keyof RoundSummary; label: string; sub: string }[] = [
    { key: 'total_putts',  label: 'Total Putts',          sub: 'incl. all greens' },
    { key: 'fairways_hit', label: 'Total Fairways',        sub: `of ${holes === 9 ? 7 : 14}` },
    { key: 'penalties',    label: 'Penalties',             sub: 'OB, water, lost' },
    { key: 'gir',          label: 'Greens in Regulation',  sub: `of ${holes}` },
    { key: 'birdies',      label: 'Birdies',               sub: 'or better' },
    { key: 'doubles',      label: 'Double Bogey +',        sub: 'or worse' },
  ]

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack} style={s.backRow}>
          <Ionicons name="chevron-back" size={18} color={C.ink1} />
          <Text style={s.backText}>New round</Text>
        </TouchableOpacity>

        <Text style={s.eyebrow}>
          {course?.name?.toUpperCase()} · {tee?.name?.toUpperCase()} TEES · {dateStr}
        </Text>
        <Text style={s.title}>Final tally</Text>

        {/* Score hero */}
        <View style={s.scoreCard}>
          <Text style={s.scoreCardLabel}>TOTAL SCORE</Text>
          <View style={s.scoreRow}>
            <Text style={[s.scoreBig, summary.total_score > 0 && isOver && { color: C.errorRed },
              summary.total_score > 0 && !isOver && { color: C.fairway }]}>
              {summary.total_score || '—'}
            </Text>
            {summary.total_score > 0 && (
              <View style={[s.diffPill, isOver ? s.diffPillOver : s.diffPillUnder]}>
                <Text style={[s.diffText, { color: isOver ? C.errorRed : C.fairway }]}>{diffStr}</Text>
              </View>
            )}
          </View>
          <Text style={s.scoreVsPar}>vs par {par}</Text>
          <View style={s.scoreControls}>
            <TouchableOpacity style={s.scoreBtn} onPress={() => update('total_score', 1)}>
              <Ionicons name="add" size={22} color={C.onDark} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.scoreBtn, s.scoreBtnMinus]} onPress={() => update('total_score', -1)}>
              <Ionicons name="remove" size={22} color={C.ink1} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Details */}
        <View style={s.detailsCard}>
          <View style={s.detailsHeader}>
            <Text style={s.detailsTitle}>ROUND DETAILS</Text>
            <Text style={s.detailsOptional}>All optional</Text>
          </View>
          {summaryFields.map(({ key, label, sub }) => (
            <View key={key} style={s.detailRow}>
              <View>
                <Text style={s.detailLabel}>{label}</Text>
                <Text style={s.detailSub}>{sub}</Text>
              </View>
              <View style={s.detailControls}>
                <Text style={s.detailValue}>{summary[key]}</Text>
                <TouchableOpacity style={s.detailBtn} onPress={() => update(key, -1)}>
                  <Ionicons name="remove" size={15} color={C.ink1} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.detailBtn, s.detailBtnPlus]} onPress={() => update(key, 1)}>
                  <Ionicons name="add" size={15} color={C.onDark} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.nudge}>The more you log, the sharper your stats get.</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={s.saveBtnText}>{loading ? 'Saving…' : 'Save round'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Hole by Hole Mode ────────────────────────────────────────
function HoleByHoleMode({ round, tee, course, holes, onSave, onBack }: any) {
  const holeCount = holes as number
  const [currentHole, setCurrentHole] = useState(0)
  const [holeData, setHoleData] = useState<HoleData[]>(
    Array.from({ length: holeCount }, () => ({
      score: null, putts: null, fairway_hit: null, gir: null, penalties: 0
    }))
  )
  const [loading, setLoading] = useState(false)
  const slideAnim = useRef(new Animated.Value(0)).current

  const hole = holeData[currentHole]
  const isLastHole = currentHole === holeCount - 1
  const par: number = 4 // placeholder — next PR wires to course_holes

  function updateHole(field: keyof HoleData, value: any) {
    const updated = [...holeData]
    updated[currentHole] = { ...updated[currentHole], [field]: value }
    setHoleData(updated)
  }

  function goToHole(index: number) {
    const dir = index > currentHole ? 1 : -1
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -dir * 28, duration: 110, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * 28, duration: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start()
    setCurrentHole(index)
  }

  const gridScores = Array.from({ length: 7 }, (_, i) => par - 2 + i).filter(s => s > 0)

  async function handleFinish() {
    setLoading(true)
    const holeRows = holeData.map((h, i) => ({
      round_id: round.id, hole_number: i + 1,
      score: h.score || 0, putts: h.putts || 0,
      fairway_hit: h.fairway_hit ?? false, gir: h.gir ?? false, penalties: h.penalties || 0,
    }))
    await supabase.from('holes').insert(holeRows)

    const totalScore    = holeData.reduce((a, h) => a + (h.score || 0), 0)
    const totalPutts    = holeData.reduce((a, h) => a + (h.putts || 0), 0)
    const fairwaysHit   = holeData.filter(h => h.fairway_hit).length
    const girCount      = holeData.filter(h => h.gir).length
    const totalPenalties = holeData.reduce((a, h) => a + h.penalties, 0)

    await supabase.from('rounds').update({
      total_score: totalScore, total_putts: totalPutts,
      fairways_hit: fairwaysHit, gir: girCount, penalties: totalPenalties,
    }).eq('id', round.id)

    setLoading(false)
    onSave({ ...round, total_score: totalScore, total_putts: totalPutts, fairways_hit: fairwaysHit, gir: girCount, penalties: totalPenalties })
  }

  const isBack = currentHole >= 9
  const miniHoles = holeCount === 18
    ? (isBack ? holeData.slice(9) : holeData.slice(0, 9))
    : holeData

  const thruScore = holeData.slice(0, currentHole).reduce((a, h) => a + (h.score || 0), 0)
  const thruDiff  = holeData.slice(0, currentHole).reduce((a, h) => a + Math.max(0, (h.score || 0) - par), 0)

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.holeBar}>
        <TouchableOpacity
          style={s.holeBarBtn}
          onPress={() => currentHole > 0 ? goToHole(currentHole - 1) : onBack()}
        >
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>

        <Text style={s.holeBarCourse} numberOfLines={1}>
          {course?.name?.toUpperCase()} · {tee?.name?.toUpperCase()}
        </Text>

        <View style={s.holeBarRight}>
          {currentHole > 0 && (
            <>
              <Text style={s.holeBarThru}>THRU {currentHole}</Text>
              <Text style={s.holeBarScore}>{thruScore || '—'}</Text>
              <View style={[s.holeBarDiff, thruDiff > 0 ? s.holeBarDiffOver : s.holeBarDiffUnder]}>
                <Text style={[s.holeBarDiffText, { color: thruDiff > 0 ? C.errorRed : C.fairway }]}>
                  {thruDiff > 0 ? `+${thruDiff}` : 'E'}
                </Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={s.holeBarBtn}
          onPress={() => currentHole < holeCount - 1 && goToHole(currentHole + 1)}
        >
          <Ionicons name="chevron-forward" size={20} color={currentHole < holeCount - 1 ? C.ink1 : C.hairline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.holeContainer} showsVerticalScrollIndicator={false}>
        {/* Hole number + par */}
        <Animated.View style={[s.holeMeta, { transform: [{ translateX: slideAnim }] }]}>
          <View>
            <Text style={s.holeEyebrow}>HOLE</Text>
            <Text style={s.holeNumber}>{currentHole + 1}</Text>
          </View>
          <View style={s.holeParBadge}>
            <Text style={s.holeParText}>PAR {par}</Text>
          </View>
        </Animated.View>

        {/* Score grid */}
        <Text style={s.fieldLabel}>SCORE</Text>
        {hole.score !== null && (
          <Text style={s.fieldHint}>{hole.score} strokes · {getScoreLabel(hole.score, par).toLowerCase()}</Text>
        )}
        <View style={s.scoreGrid}>
          {gridScores.map((score) => {
            const isSelected = hole.score === score
            const label = getScoreLabel(score, par)
            const accentColor = scoreCellColor(score, par)
            return (
              <TouchableOpacity
                key={score}
                style={[s.scoreCell, isSelected && { backgroundColor: accentColor, borderColor: accentColor }]}
                onPress={() => updateHole('score', score)}
              >
                <Text style={[s.scoreCellNum, isSelected && { color: C.onDark }]}>{score}</Text>
                <Text style={[s.scoreCellLabel, isSelected && { color: C.onDarkMuted }]}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Putts */}
        <Text style={s.fieldLabel}>PUTTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {[0, 1, 2, 3, 4, 5].map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.chip, hole.putts === p && s.chipActive]}
              onPress={() => updateHole('putts', p)}
            >
              <Text style={[s.chipText, hole.putts === p && s.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Fairway + GIR */}
        <View style={s.twoCol}>
          <View style={s.twoColItem}>
            <Text style={s.fieldLabel}>FAIRWAY</Text>
            {par === 3 ? (
              <Text style={s.naText}>Par 3 — n/a</Text>
            ) : (
              <View style={s.toggleRow}>
                {[{ val: true, label: 'Hit' }, { val: false, label: 'Miss' }].map(({ val, label }) => (
                  <TouchableOpacity
                    key={label}
                    style={[s.toggleBtn,
                      hole.fairway_hit === val && (val ? s.toggleBtnGreen : s.toggleBtnRed)
                    ]}
                    onPress={() => updateHole('fairway_hit', val)}
                  >
                    <Text style={[s.toggleBtnText, hole.fairway_hit === val && s.toggleBtnTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={s.twoColItem}>
            <Text style={s.fieldLabel}>GREEN IN REG</Text>
            <View style={s.toggleRow}>
              {[{ val: true, label: 'Hit' }, { val: false, label: 'Miss' }].map(({ val, label }) => (
                <TouchableOpacity
                  key={label}
                  style={[s.toggleBtn,
                    hole.gir === val && (val ? s.toggleBtnGreen : s.toggleBtnRed)
                  ]}
                  onPress={() => updateHole('gir', val)}
                >
                  <Text style={[s.toggleBtnText, hole.gir === val && s.toggleBtnTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Penalties */}
        <Text style={s.fieldLabel}>PENALTY STROKES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {[0, 1, 2, 3, 4].map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.chip, hole.penalties === p && s.chipPenaltyActive]}
              onPress={() => updateHole('penalties', p)}
            >
              <Text style={[s.chipText, hole.penalties === p && s.chipTextActive]}>
                {p === 4 ? '4+' : p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mini scorecard */}
        <View style={s.miniCard}>
          <View style={s.miniHeader}>
            <Text style={s.miniTitle}>
              {holeCount === 18 ? (isBack ? 'BACK NINE' : 'FRONT NINE') : 'SCORECARD'}
            </Text>
            <Text style={s.miniPlayed}>
              {holeData.filter(h => h.score !== null).length}/{holeCount} played
            </Text>
          </View>
          <View style={s.miniHoles}>
            {miniHoles.map((h, i) => {
              const hNum = isBack ? i + 10 : i + 1
              const isCurrent = hNum - 1 === currentHole
              const hasScore = h.score !== null
              const diff = hasScore ? h.score! - par : 0
              return (
                <TouchableOpacity
                  key={hNum}
                  style={[s.miniHole, isCurrent && s.miniHoleCurrent]}
                  onPress={() => goToHole(hNum - 1)}
                >
                  <Text style={[s.miniNum, isCurrent && s.miniNumActive]}>{hNum}</Text>
                  <Text style={[
                    s.miniScore,
                    isCurrent && s.miniNumActive,
                    hasScore && diff >= 2 && { color: C.errorRed },
                    hasScore && diff === 1 && { color: C.flagYellow },
                    hasScore && diff <= -1 && { color: C.fairway },
                  ]}>
                    {hasScore ? h.score : '·'}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.saveBtn}
          onPress={isLastHole ? handleFinish : () => goToHole(currentHole + 1)}
          disabled={loading}
        >
          <Text style={s.saveBtnText}>
            {loading ? 'Saving…' : isLastHole ? 'Finish round ✓' : `Next hole →`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Main export ──────────────────────────────────────────────
export default function EnterScoresScreen({ route, navigation }: any) {
  const { round, holes, tee, course, mode } = route.params

  function handleSave(updatedRound: any) {
    navigation.navigate('RoundSummary', { round: updatedRound, tee, course, holes })
  }

  function handleBack() { navigation.goBack() }

  if (mode === 'total') {
    return <TotalScoreMode round={round} tee={tee} course={course} holes={holes} onSave={handleSave} onBack={handleBack} />
  }
  return <HoleByHoleMode round={round} tee={tee} course={course} holes={holes} onSave={handleSave} onBack={handleBack} />
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },

  // Total score mode
  container: { padding: 24, paddingTop: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24, marginTop: 8 },
  backText: { fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 6 },
  title: { fontFamily: F.serifBold, fontSize: 36, color: C.ink1, marginBottom: 20 },

  scoreCard: {
    backgroundColor: C.cardBg, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  scoreCardLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  scoreBig: { fontFamily: F.serifBold, fontSize: 72, color: C.ink1, lineHeight: 80 },
  diffPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  diffPillOver: { backgroundColor: '#FBE8E6' },
  diffPillUnder: { backgroundColor: '#E6F4EC' },
  diffText: { fontFamily: F.sansBold, fontSize: 15 },
  scoreVsPar: { fontFamily: F.mono, fontSize: 12, color: C.ink3, marginBottom: 16 },
  scoreControls: { flexDirection: 'row', gap: 8 },
  scoreBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: C.fairwayDark, alignItems: 'center', justifyContent: 'center',
  },
  scoreBtnMinus: { backgroundColor: C.insetBg },

  detailsCard: {
    backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  detailsTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3 },
  detailsOptional: { fontFamily: F.sans, fontSize: 12, color: C.ink3, fontStyle: 'italic' },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  detailLabel: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink1 },
  detailSub: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },
  detailControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailValue: { fontFamily: F.serifBold, fontSize: 20, color: C.ink1, minWidth: 28, textAlign: 'center' },
  detailBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.insetBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  detailBtnPlus: { backgroundColor: C.fairwayDark, borderColor: C.fairwayDark },
  nudge: { fontFamily: F.sans, textAlign: 'center', fontSize: 13, color: C.ink3, fontStyle: 'italic', marginTop: 24 },

  // Hole-by-hole
  holeBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 60, paddingBottom: 12,
    backgroundColor: C.pageBg, borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  holeBarBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  holeBarCourse: { flex: 1, fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.ink3, textAlign: 'center' },
  holeBarRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  holeBarThru: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  holeBarScore: { fontFamily: F.serifBold, fontSize: 22, color: C.ink1 },
  holeBarDiff: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  holeBarDiffOver: { backgroundColor: '#FBE8E6' },
  holeBarDiffUnder: { backgroundColor: '#E6F4EC' },
  holeBarDiffText: { fontFamily: F.sansBold, fontSize: 11 },

  holeContainer: { padding: 20, paddingTop: 16 },
  holeMeta: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
  holeEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3, marginBottom: 2 },
  holeNumber: { fontFamily: F.serifBold, fontSize: 72, color: C.ink1, lineHeight: 72 },
  holeParBadge: {
    backgroundColor: C.fairwayDark, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  holeParText: { fontFamily: F.sansBold, fontSize: 16, color: C.onDark, letterSpacing: 0.5 },

  fieldLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 10, marginTop: 20 },
  fieldHint: { fontFamily: F.sans, fontSize: 12, color: C.ink2, marginBottom: 8, marginTop: -6, fontStyle: 'italic' },

  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scoreCell: {
    width: (width - 40 - 24) / 4,
    backgroundColor: C.cardBg, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: C.border,
  },
  scoreCellNum: { fontFamily: F.serifBold, fontSize: 24, color: C.ink1 },
  scoreCellLabel: { fontFamily: F.mono, fontSize: 8, color: C.ink3, letterSpacing: 0.5, marginTop: 4 },

  chipScroll: { marginHorizontal: -20 },
  chip: {
    width: 52, height: 52, borderRadius: 10, backgroundColor: C.cardBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.border, marginLeft: 8,
  },
  chipActive: { backgroundColor: C.fairwayDark, borderColor: C.fairwayDark },
  chipPenaltyActive: { backgroundColor: C.clay, borderColor: C.clay },
  chipText: { fontFamily: F.serifBold, fontSize: 18, color: C.ink1 },
  chipTextActive: { color: C.onDark },

  twoCol: { flexDirection: 'row', gap: 20, marginTop: 4 },
  twoColItem: { flex: 1 },
  naText: { fontFamily: F.sans, fontSize: 13, color: C.ink3, fontStyle: 'italic', marginTop: 6 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.border,
  },
  toggleBtnGreen: { backgroundColor: C.fairway, borderColor: C.fairway },
  toggleBtnRed: { backgroundColor: C.errorRed, borderColor: C.errorRed },
  toggleBtnText: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink2 },
  toggleBtnTextActive: { color: C.onDark },

  miniCard: {
    backgroundColor: C.cardBg, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: C.border, marginTop: 24,
  },
  miniHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  miniTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3 },
  miniPlayed: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  miniHoles: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  miniHole: { alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6, borderRadius: 8, minWidth: 28 },
  miniHoleCurrent: { backgroundColor: C.insetBg },
  miniNum: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  miniNumActive: { color: C.ink1, fontFamily: F.monoBold },
  miniScore: { fontFamily: F.sansSemiBold, fontSize: 13, color: C.ink1, marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: 40, backgroundColor: C.pageBg,
    borderTopWidth: 1, borderTopColor: C.hairline,
  },
  saveBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark, letterSpacing: 0.3 },
})