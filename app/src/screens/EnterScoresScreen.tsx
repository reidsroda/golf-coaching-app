import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Dimensions, TextInput,
  ImageBackground, Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import * as Location from 'expo-location'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')
const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }
const CARD_IMAGE = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335687/CardImage_howewh.jpg' }


type HoleData = {
  score: number | null
  putts: number | null
  fairway_hit: boolean | null
  gir: boolean | null
  penalties: number
}

type CourseHole = {
  hole_number: number
  par: number
  yardage: number | null
  stroke_index: number | null
  green_lat: number | null
  green_lng: number | null
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
  if (diff <= -1) return C.fairway
  if (diff === 0) return C.ink1
  if (diff === 1) return C.flagYellow
  return C.errorRed
}

// ─── Haversine distance (meters) ─────────────────────────────
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function metersToYards(m: number): number {
  return Math.round(m * 1.09361)
}

// ─── Total Score Mode ─────────────────────────────────────────
function TotalScoreMode({ round, tee, course, holes, onSave, onBack }: any) {
  const [summary, setSummary] = useState<RoundSummary>({
    total_score: 0, total_putts: 0, fairways_hit: 0,
    gir: 0, penalties: 0, birdies: 0, doubles: 0,
  })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const par = tee?.par_total || 72

  function setField(field: keyof RoundSummary, text: string) {
    const val = parseInt(text)
    setSummary(prev => ({ ...prev, [field]: isNaN(val) ? 0 : Math.max(0, val) }))
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
  const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${Math.abs(diff)} OVER` : `-${Math.abs(diff)} UNDER`
  const isOver = diff > 0
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()

  const summaryFields: { key: keyof RoundSummary; label: string; sub: string }[] = [
    { key: 'total_putts',  label: 'Total Putts',         sub: 'incl. all greens' },
    { key: 'fairways_hit', label: 'Total Fairways',       sub: `of ${holes === 9 ? 7 : 14}` },
    { key: 'penalties',    label: 'Penalties',            sub: 'OB, water, lost' },
    { key: 'gir',          label: 'Greens in Regulation', sub: `of ${holes}` },
    { key: 'birdies',      label: 'Birdies',              sub: 'or better' },
    { key: 'doubles',      label: 'Double Bogey +',       sub: 'or worse' },
  ]

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Nav */}
        <View style={s.navBar}>
          <TouchableOpacity onPress={onBack} style={s.navBack}>
            <Ionicons name="chevron-back" size={20} color={C.ink1} />
          </TouchableOpacity>
          <Text style={s.navTitle}>New round</Text>
          <Text style={s.navStep}>1/2</Text>
        </View>

        <View style={s.eyebrowRow}>
          <View style={[s.teeDot, { backgroundColor: C.teeBlue }]} />
          <Text style={s.eyebrow}>
            {course?.name?.toUpperCase()} · {tee?.name?.toUpperCase()} TEES · {dateStr}
          </Text>
        </View>
        <Text style={s.titleTotal}>Final tally</Text>

        {/* Hero card — brighter image, less overlay */}
        <View style={s.heroCard}>
          <Image source={CARD_IMAGE} style={s.heroCardBg} resizeMode="cover" />
          <View style={s.heroCardOverlay} />
          <View style={s.heroCardContent}>
            <Text style={s.heroCardLabel}>FINAL TALLY</Text>
            <Text style={s.heroCardCourse}>{course?.name}</Text>
            <Text style={s.heroCardMeta}>
              {tee?.name?.toUpperCase()} TEES · PAR {par}
            </Text>
            {editing ? (
              <TextInput
                style={s.heroScoreInput}
                keyboardType="numeric"
                maxLength={3}
                value={summary.total_score > 0 ? String(summary.total_score) : ''}
                onChangeText={t => setField('total_score', t)}
                onBlur={() => setEditing(false)}
                autoFocus
                placeholderTextColor="rgba(241,236,224,0.4)"
                placeholder="72"
                selectionColor={C.onDark}
              />
            ) : (
              <Text style={s.heroScore}>
                {summary.total_score > 0 ? summary.total_score : '—'}
              </Text>
            )}
            <TouchableOpacity style={s.heroRow} onPress={() => setEditing(true)}>
              {summary.total_score > 0 && (
                <View style={[s.heroPill, isOver ? s.heroPillOver : s.heroPillUnder]}>
                  <Text style={s.heroPillText}>{diffStr}</Text>
                </View>
              )}
              <Text style={s.heroTapEdit}>TAP TO EDIT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Round details — text input version */}
        <View style={s.detailsHeaderRow}>
          <Text style={s.detailsLabel}>ROUND DETAILS</Text>
          <Text style={s.detailsOptional}>All optional</Text>
        </View>

        <View style={s.detailsCard}>
          {summaryFields.map(({ key, label, sub }, i) => (
            <View key={key} style={[s.detailRow, i < summaryFields.length - 1 && s.detailRowBorder]}>
              <View style={s.detailLeft}>
                <Text style={s.detailLabel}>{label}</Text>
                <Text style={s.detailSub}>{sub}</Text>
              </View>
              <TextInput
                style={s.detailInput}
                keyboardType="numeric"
                maxLength={3}
                value={summary[key] > 0 ? String(summary[key]) : ''}
                onChangeText={t => setField(key, t)}
                placeholder="0"
                placeholderTextColor={C.ink3}
                textAlign="right"
              />
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
    </ImageBackground>
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
  const [courseHoles, setCourseHoles] = useState<CourseHole[]>([])
  const [loading, setLoading] = useState(false)
  const [customScoreText, setCustomScoreText] = useState('')
  const [distanceYards, setDistanceYards] = useState<number | null>(null)
  const [locationGranted, setLocationGranted] = useState(false)
  const [locating, setLocating] = useState(false)
  const locationSub = useRef<Location.LocationSubscription | null>(null)
  const lastLocation = useRef<{ lat: number; lng: number } | null>(null)
  const currentHoleRef = useRef(0)
  const courseHolesRef = useRef<CourseHole[]>([])
  const slideAnim = useRef(new Animated.Value(0)).current
  const blinkAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    async function loadHoles() {
      if (!tee?.id) return
      const { data } = await supabase
        .from('course_holes')
        .select('hole_number, par, yardage, stroke_index, green_lat, green_lng')
        .eq('tee_set_id', tee.id)
        .order('hole_number', { ascending: true })
        .limit(holeCount)
      if (data && data.length > 0) {
        setCourseHoles(data)
        courseHolesRef.current = data
      }
    }
    loadHoles()
  }, [tee?.id])

  // Keep refs in sync so GPS callback always has latest values
  useEffect(() => { currentHoleRef.current = currentHole }, [currentHole])
  useEffect(() => { courseHolesRef.current = courseHoles }, [courseHoles])

  // Recalculate using refs (no stale closure)
  function recalcDistance(lat: number, lng: number) {
    const hole = courseHolesRef.current[currentHoleRef.current]
    const greenLat = hole?.green_lat
    const greenLng = hole?.green_lng
    if (greenLat && greenLng) {
      const meters = haversineMeters(lat, lng, greenLat, greenLng)
      setDistanceYards(metersToYards(meters))
    }
  }

  // GPS subscription — updates every 3 seconds
  useEffect(() => {
    let active = true
    async function startGPS() {
      setLocating(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setLocating(false); return }
      setLocationGranted(true)
      setLocating(false)
      // Start blinking red dot
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start()
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 2 },
        (loc) => {
          if (!active) return
          const { latitude, longitude } = loc.coords
          lastLocation.current = { lat: latitude, lng: longitude }
          recalcDistance(latitude, longitude)
        }
      )
    }
    startGPS()
    return () => {
      active = false
      locationSub.current?.remove()
    }
  }, [])

  // Recalc when hole data loads (fixes race condition)
  useEffect(() => {
    if (courseHoles.length > 0 && lastLocation.current) {
      recalcDistance(lastLocation.current.lat, lastLocation.current.lng)
    }
  }, [courseHoles])

  // Recalc when switching holes
  useEffect(() => {
    setDistanceYards(null)
    if (courseHolesRef.current.length > 0 && lastLocation.current) {
      recalcDistance(lastLocation.current.lat, lastLocation.current.lng)
    }
  }, [currentHole])

  const hole = holeData[currentHole]
  const courseHole = courseHoles[currentHole]
  const par = courseHole?.par ?? 4
  const yardage = courseHole?.yardage ?? null
  const strokeIndex = courseHole?.stroke_index ?? null
  const isLastHole = currentHole === holeCount - 1

  function updateHole(field: keyof HoleData, value: any) {
    const updated = [...holeData]
    updated[currentHole] = { ...updated[currentHole], [field]: value }
    setHoleData(updated)
    if (field === 'score') setCustomScoreText('')
  }

  function goToHole(index: number) {
    const dir = index > currentHole ? 1 : -1
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -dir * 28, duration: 110, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * 28, duration: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start()
    setCurrentHole(index)
    setCustomScoreText('')
  }

  function handleCustomScore(text: string) {
    setCustomScoreText(text)
    const val = parseInt(text)
    if (!isNaN(val) && val > 0 && val <= 20) {
      const updated = [...holeData]
      updated[currentHole] = { ...updated[currentHole], score: val }
      setHoleData(updated)
    }
  }

  const gridScores = Array.from({ length: 7 }, (_, i) => par - 2 + i).filter(sc => sc > 0 && sc <= 8)
  const scoreOutsideGrid = hole.score !== null && (hole.score > 8 || hole.score < par - 2)

  async function handleFinish() {
    setLoading(true)
    const holeRows = holeData.map((h, i) => ({
      round_id: round.id, hole_number: i + 1,
      score: h.score || 0, putts: h.putts || 0,
      fairway_hit: h.fairway_hit ?? false, gir: h.gir ?? false, penalties: h.penalties || 0,
    }))
    await supabase.from('holes').insert(holeRows)
    const totalScore     = holeData.reduce((a, h) => a + (h.score || 0), 0)
    const totalPutts     = holeData.reduce((a, h) => a + (h.putts || 0), 0)
    const fairwaysHit    = holeData.filter(h => h.fairway_hit).length
    const girCount       = holeData.filter(h => h.gir).length
    const totalPenalties = holeData.reduce((a, h) => a + h.penalties, 0)
    await supabase.from('rounds').update({
      total_score: totalScore, total_putts: totalPutts,
      fairways_hit: fairwaysHit, gir: girCount, penalties: totalPenalties,
    }).eq('id', round.id)
    setLoading(false)
    onSave({ ...round, total_score: totalScore, total_putts: totalPutts, fairways_hit: fairwaysHit, gir: girCount, penalties: totalPenalties })
  }

  const isBack = currentHole >= 9
  const miniHoles = holeCount === 18 ? (isBack ? holeData.slice(9) : holeData.slice(0, 9)) : holeData
  const thruScore = holeData.slice(0, currentHole).reduce((a, h) => a + (h.score || 0), 0)
  const thruPar   = courseHoles.slice(0, currentHole).reduce((a, h) => a + (h.par || 4), 0)
  const thruDiff  = thruScore - thruPar

  const SIDE_PAD = 20

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      {/* Top bar */}
      <View style={s.holeBar}>
        <TouchableOpacity style={s.holeBarBtn} onPress={() => currentHole > 0 ? goToHole(currentHole - 1) : onBack()}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.holeBarCourse} numberOfLines={1}>
          {course?.name?.toUpperCase()} · {tee?.name?.toUpperCase()}
        </Text>
        <View style={s.holeBarRight}>
          {currentHole > 0 && thruScore > 0 && (
            <>
              <Text style={s.holeBarThru}>THRU {currentHole}</Text>
              <Text style={s.holeBarScore}>{thruScore}</Text>
              <View style={[s.holeBarDiff, thruDiff > 0 ? s.holeBarDiffOver : s.holeBarDiffUnder]}>
                <Text style={[s.holeBarDiffText, { color: thruDiff > 0 ? C.errorRed : C.fairway }]}>
                  {thruDiff === 0 ? 'E' : thruDiff > 0 ? `+${thruDiff}` : `${thruDiff}`}
                </Text>
              </View>
            </>
          )}
        </View>
        <TouchableOpacity style={s.holeBarBtn} onPress={() => currentHole < holeCount - 1 && goToHole(currentHole + 1)}>
          <Ionicons name="chevron-forward" size={20} color={currentHole < holeCount - 1 ? C.ink1 : C.hairline} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[s.holeContainer, { paddingHorizontal: SIDE_PAD }]} showsVerticalScrollIndicator={false}>

        {/* Hole number + par */}
        <Animated.View style={[s.holeMeta, { transform: [{ translateX: slideAnim }] }]}>
          <View>
            <Text style={s.holeEyebrow}>HOLE</Text>
            <Text style={s.holeNumber}>{currentHole + 1}</Text>
          </View>
          <View style={s.holeStats}>
            {yardage !== null && (
              <View style={s.holeStat}>
                <Text style={s.holeStatLabel}>YARDS</Text>
                <Text style={s.holeStatValue}>{yardage}</Text>
              </View>
            )}
            {strokeIndex !== null && (
              <View style={s.holeStat}>
                <Text style={s.holeStatLabel}>HDCP</Text>
                <Text style={s.holeStatValue}>{strokeIndex}</Text>
              </View>
            )}
          </View>
          <View style={s.holeParBadge}>
            <Text style={s.holeParText}>PAR {par}</Text>
          </View>
        </Animated.View>

        {/* Distance to pin */}
        {locationGranted && (
          <View style={s.distanceCard}>
            <Animated.View style={[s.distanceDot, { opacity: blinkAnim }]} />
            <View style={s.distanceTextWrap}>
              {distanceYards !== null ? (
                <>
                  <Text style={s.distanceValue}>{distanceYards}</Text>
                  <Text style={s.distanceUnit}> yds to pin</Text>
                </>
              ) : (
                <Text style={s.distanceLocating}>
                  {locating ? 'Getting location…' : 'Calculating…'}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── SCORE ── */}
        <Text style={s.sectionLabel}>SCORE</Text>
        {hole.score !== null && (
          <Text style={s.sectionHint}>{hole.score} strokes · {getScoreLabel(hole.score, par).toLowerCase()}</Text>
        )}
        <View style={s.scoreGrid}>
          {gridScores.map((sc) => {
            const isSelected = hole.score === sc && !scoreOutsideGrid
            const accentColor = scoreCellColor(sc, par)
            return (
              <TouchableOpacity
                key={sc}
                style={[s.scoreCell, isSelected && { backgroundColor: accentColor, borderColor: accentColor }]}
                onPress={() => updateHole('score', sc)}
              >
                <Text style={[s.scoreCellNum, isSelected && { color: C.onDark }]}>{sc}</Text>
                <Text style={[s.scoreCellLabel, isSelected && { color: C.onDarkMuted }]}>
                  {getScoreLabel(sc, par)}
                </Text>
              </TouchableOpacity>
            )
          })}
          <View style={[s.scoreCell, s.scoreCellCustom, scoreOutsideGrid && { borderColor: C.clay, backgroundColor: C.clay }]}>
            <TextInput
              style={[s.scoreCellCustomInput, scoreOutsideGrid && { color: C.onDark }]}
              placeholder="9+"
              placeholderTextColor={C.ink3}
              keyboardType="numeric"
              maxLength={2}
              value={customScoreText}
              onChangeText={handleCustomScore}
              textAlign="center"
            />
            <Text style={[s.scoreCellLabel, scoreOutsideGrid && { color: C.onDarkMuted }]}>OTHER</Text>
          </View>
        </View>

        {/* ── PUTTS ── */}
        <Text style={s.sectionLabel}>PUTTS</Text>
        <View style={s.chipRow}>
          {[0, 1, 2, 3, 4, 5].map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.chip, { flex: 1 }, hole.putts === p && s.chipActive]}
              onPress={() => updateHole('putts', p)}
            >
              <Text style={[s.chipText, hole.putts === p && s.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── FAIRWAY + GIR ── */}
        <View style={s.twoCol}>
          <View style={s.twoColItem}>
            <Text style={s.sectionLabel}>FAIRWAY</Text>
            {par === 3 ? (
              <Text style={s.naText}>Par 3 — n/a</Text>
            ) : (
              <View style={s.toggleRow}>
                {[{ val: true, label: 'Hit' }, { val: false, label: 'Miss' }].map(({ val, label }) => (
                  <TouchableOpacity
                    key={label}
                    style={[s.toggleBtn, hole.fairway_hit === val && (val ? s.toggleBtnGreen : s.toggleBtnRed)]}
                    onPress={() => updateHole('fairway_hit', val)}
                  >
                    <Text style={[s.toggleBtnText, hole.fairway_hit === val && s.toggleBtnTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={s.twoColItem}>
            <Text style={s.sectionLabel}>GREEN IN REG</Text>
            <View style={s.toggleRow}>
              {[{ val: true, label: 'Hit' }, { val: false, label: 'Miss' }].map(({ val, label }) => (
                <TouchableOpacity
                  key={label}
                  style={[s.toggleBtn, hole.gir === val && (val ? s.toggleBtnGreen : s.toggleBtnRed)]}
                  onPress={() => updateHole('gir', val)}
                >
                  <Text style={[s.toggleBtnText, hole.gir === val && s.toggleBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── PENALTY STROKES ── */}
        <Text style={s.sectionLabel}>PENALTY STROKES</Text>
        <View style={s.chipRow}>
          {[0, 1, 2, 3, 4].map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.chip, { flex: 1 }, hole.penalties === p && s.chipPenaltyActive]}
              onPress={() => updateHole('penalties', p)}
            >
              <Text style={[s.chipText, hole.penalties === p && s.chipTextActive]}>
                {p === 4 ? '4+' : p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SCORECARD ── */}
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
              const holePar = courseHoles[hNum - 1]?.par ?? 4
              const diff = hasScore ? h.score! - holePar : 0
              return (
                <TouchableOpacity
                  key={hNum}
                  style={[s.miniHole, isCurrent && s.miniHoleCurrent]}
                  onPress={() => goToHole(hNum - 1)}
                >
                  <Text style={[s.miniNum, isCurrent && s.miniNumActive]}>{hNum}</Text>
                  <Text style={[
                    s.miniScore, isCurrent && s.miniNumActive,
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
    </ImageBackground>
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
  topoBg: { opacity: 0.55, resizeMode: 'cover' },

  // Total score mode
  container: { paddingBottom: 24 },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12,
  },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },
  navStep: { fontFamily: F.mono, fontSize: 12, color: C.ink3 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 4 },
  teeDot: { width: 10, height: 10, borderRadius: 5 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.ink2 },
  titleTotal: { fontFamily: F.serifBold, fontSize: 36, color: C.ink1, paddingHorizontal: 20, marginBottom: 20 },

  // Hero card — reduced overlay opacity for brighter image
  heroCard: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', height: 220, marginBottom: 28 },
  heroCardBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroCardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,50,30,0.50)' },
  heroCardContent: { flex: 1, padding: 20, justifyContent: 'space-between' },
  heroCardLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.5, color: C.onDarkMuted },
  heroCardCourse: { fontFamily: F.serifBoldItalic, fontSize: 22, color: C.onDark, lineHeight: 26 },
  heroCardMeta: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.onDarkMuted, marginTop: 2 },
  heroScore: { fontFamily: F.serifBold, fontSize: 80, color: C.onDark, lineHeight: 86 },
  heroScoreInput: { fontFamily: F.serifBold, fontSize: 80, color: C.onDark, lineHeight: 86, padding: 0, margin: 0 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  heroPillOver: { backgroundColor: C.errorRed },
  heroPillUnder: { backgroundColor: C.fairway },
  heroPillText: { fontFamily: F.sansBold, fontSize: 12, color: C.onDark, letterSpacing: 0.5 },
  heroTapEdit: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.onDarkMuted },

  // Details — text input style
  detailsHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 20, marginBottom: 12,
  },
  detailsLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3 },
  detailsOptional: { fontFamily: F.sans, fontSize: 12, color: C.ink3, fontStyle: 'italic' },
  detailsCard: {
    marginHorizontal: 20, backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  detailLeft: { flex: 1 },
  detailLabel: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink1 },
  detailSub: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },
  detailInput: {
    fontFamily: F.serifBold, fontSize: 20, color: C.ink1,
    minWidth: 52, textAlign: 'right',
    paddingVertical: 4, paddingHorizontal: 8,
    borderBottomWidth: 1.5, borderBottomColor: C.border,
  },
  nudge: { fontFamily: F.sans, textAlign: 'center', fontSize: 13, color: C.ink3, fontStyle: 'italic', marginTop: 24, paddingHorizontal: 20 },

  // Hole by hole
  holeBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.hairline,
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

  holeContainer: { paddingTop: 16, paddingBottom: 16 },
  holeMeta: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 },
  holeEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3, marginBottom: 2 },
  holeNumber: { fontFamily: F.serifBold, fontSize: 72, color: C.ink1, lineHeight: 72 },
  holeStats: { flex: 1, flexDirection: 'row', gap: 16, paddingLeft: 16, paddingBottom: 4, alignItems: 'flex-end' },
  holeStat: { alignItems: 'flex-start' },
  holeStatLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 2 },
  holeStatValue: { fontFamily: F.mono, fontSize: 14, color: C.ink2 },
  holeParBadge: { backgroundColor: C.fairwayDark, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  holeParText: { fontFamily: F.sansBold, fontSize: 16, color: C.onDark, letterSpacing: 0.5 },

  // Section labels for hole-by-hole
  sectionLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 10, marginTop: 20 },
  sectionHint: { fontFamily: F.sans, fontSize: 12, color: C.ink2, marginBottom: 8, marginTop: -6, fontStyle: 'italic' },

  // Score grid — full width with equal cells
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scoreCell: {
    width: (width - 40 - 18) / 4,
    backgroundColor: C.cardBg, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: C.border,
  },
  scoreCellNum: { fontFamily: F.serifBold, fontSize: 24, color: C.ink1 },
  scoreCellLabel: { fontFamily: F.mono, fontSize: 8, color: C.ink3, letterSpacing: 0.5, marginTop: 4 },
  scoreCellCustom: { justifyContent: 'center' },
  scoreCellCustomInput: { fontFamily: F.serifBold, fontSize: 22, color: C.ink1, width: '100%', textAlign: 'center', padding: 0 },

  // Chips — full width row
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    height: 52, borderRadius: 10, backgroundColor: C.cardBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.fairwayDark, borderColor: C.fairwayDark },
  chipPenaltyActive: { backgroundColor: C.clay, borderColor: C.clay },
  chipText: { fontFamily: F.serifBold, fontSize: 18, color: C.ink1 },
  chipTextActive: { color: C.onDark },

  // Fairway / GIR
  twoCol: { flexDirection: 'row', gap: 16, marginTop: 4 },
  twoColItem: { flex: 1 },
  naText: { fontFamily: F.sans, fontSize: 13, color: C.ink3, fontStyle: 'italic', marginTop: 6 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
    backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.border,
  },
  toggleBtnGreen: { backgroundColor: C.fairway, borderColor: C.fairway },
  toggleBtnRed: { backgroundColor: C.errorRed, borderColor: C.errorRed },
  toggleBtnText: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink2 },
  toggleBtnTextActive: { color: C.onDark },

  // Mini scorecard
  miniCard: {
    backgroundColor: C.cardBg, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: C.border, marginTop: 24,
  },
  miniHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  miniTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3 },
  miniPlayed: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  miniHoles: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniHole: { flex: 1, minWidth: 28, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  miniHoleCurrent: { backgroundColor: C.insetBg },
  miniNum: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  miniNumActive: { color: C.ink1, fontFamily: F.monoBold },
  miniScore: { fontFamily: F.sansSemiBold, fontSize: 13, color: C.ink1, marginTop: 2 },

  distanceDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.errorRed,
    marginRight: 2,
  },
  distanceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardBg, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 4, alignSelf: 'flex-start',
  },
  distanceTextWrap: { flexDirection: 'row', alignItems: 'baseline' },
  distanceValue: { fontFamily: F.serifBold, fontSize: 22, color: C.ink1 },
  distanceUnit: { fontFamily: F.mono, fontSize: 11, color: C.ink3, letterSpacing: 0.5 },
  distanceLocating: { fontFamily: F.mono, fontSize: 11, color: C.ink3, fontStyle: 'italic' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: C.hairline,
    backgroundColor: 'rgba(241,236,224,0.92)',
  },
  saveBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark, letterSpacing: 0.3 },
})