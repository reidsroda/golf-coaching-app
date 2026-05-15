import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')

type Course = { id: string; name: string; city: string; state: string }
type TeeSet = {
  id: string; name: string; color: string | null; gender: string
  course_rating: number; slope_rating: number; total_yards: number; par_total: number
}

const TEE_COLOR_MAP: Record<string, string> = {
  black: C.teeBlack, blue: C.teeBlue, white: C.teeWhite,
  gold: C.teeGold, red: C.teeRed, silver: '#9CA3AF',
  tournament: C.teeBlack, green: '#2F5A3E',
}

function getTeeColor(tee: TeeSet): string {
  if (tee.color) return tee.color
  const lower = tee.name.toLowerCase()
  for (const [key, hex] of Object.entries(TEE_COLOR_MAP)) {
    if (lower.includes(key)) return hex
  }
  return C.ink3
}

export default function AddRoundScreen({ navigation }: any) {
  const [query, setQuery] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [teeSets, setTeeSets] = useState<TeeSet[]>([])
  const [selectedTee, setSelectedTee] = useState<TeeSet | null>(null)
  const [holes, setHoles] = useState<9 | 18>(18)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [scoreMethod, setScoreMethod] = useState<'total' | 'hole' | null>(null)

  async function searchCourses(text: string) {
    setQuery(text)
    if (text.length < 2) { setCourses([]); setShowDropdown(false); return }
    setSearching(true)
    const { data } = await supabase
      .from('courses')
      .select('id, name, city, state')
      .ilike('name', `%${text}%`)
      .limit(8)
    setCourses(data || [])
    setShowDropdown(true)
    setSearching(false)
  }

  async function selectCourse(course: Course) {
    setSelectedCourse(course)
    setQuery(course.name)
    setShowDropdown(false)
    setCourses([])
    setSelectedTee(null)
    const { data } = await supabase
      .from('tee_sets')
      .select('id, name, color, gender, course_rating, slope_rating, total_yards, par_total')
      .eq('course_id', course.id)
      .eq('gender', 'M')
      .order('total_yards', { ascending: false })
    setTeeSets(data || [])
    if (data && data.length > 0) setSelectedTee(data[0])
  }

  async function handleStartRound() {
    if (!selectedCourse || !selectedTee || !scoreMethod) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase.from('rounds').insert({
      user_id: user.id,
      course_id: selectedCourse.id,
      course_name: selectedCourse.name,
      tee_set_id: selectedTee.id,
      date: today,
      holes,
      total_score: 0, total_putts: 0, fairways_hit: 0, gir: 0, penalties: 0,
    }).select().single()
    if (error || !data) return
    navigation.navigate('EnterScores', { round: data, holes, tee: selectedTee, course: selectedCourse, mode: scoreMethod })
  }

  const canStart = selectedCourse && selectedTee && scoreMethod
  const filteredTees = teeSets.filter(t => holes === 9 ? true : (t.total_yards || 0) > 2000)

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={s.eyebrow}>NEW ROUND</Text>
        <Text style={s.title}>Tell us about</Text>
        <Text style={s.titleItalic}>your round.</Text>

        {/* Course search */}
        <Text style={s.label}>COURSE</Text>
        <View style={s.searchWrapper}>
          <View style={[s.searchBox, selectedCourse && s.searchBoxActive]}>
            {selectedCourse && selectedTee && (
              <View style={[s.courseDot, { backgroundColor: getTeeColor(selectedTee) },
                getTeeColor(selectedTee) === C.teeWhite && s.courseDotLight
              ]} />
            )}
            <TextInput
              style={s.searchInput}
              placeholder="Search courses…"
              placeholderTextColor={C.ink3}
              value={query}
              onChangeText={searchCourses}
              onFocus={() => query.length >= 2 && setShowDropdown(true)}
            />
            {searching
              ? <Ionicons name="ellipsis-horizontal" size={16} color={C.ink3} />
              : <Ionicons name="search-outline" size={16} color={C.ink3} />
            }
          </View>

          {showDropdown && courses.length > 0 && (
            <View style={s.dropdown}>
              {courses.map((c, i) => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.dropdownItem, i < courses.length - 1 && s.dropdownBorder]}
                  onPress={() => selectCourse(c)}
                >
                  <Text style={s.dropdownName}>{c.name}</Text>
                  <Text style={s.dropdownMeta}>{c.city}, {c.state}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tee selector */}
        {selectedCourse && filteredTees.length > 0 && (
          <>
            <View style={s.teeHeader}>
              <Text style={s.label}>TEES</Text>
              {selectedTee && (
                <Text style={s.teeInfo}>
                  {selectedTee.total_yards?.toLocaleString()} yds · {selectedTee.course_rating} / {selectedTee.slope_rating}
                </Text>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={s.teeScroll} contentContainerStyle={s.teeScrollContent}
            >
              {filteredTees.map((tee) => {
                const isSelected = selectedTee?.id === tee.id
                const color = getTeeColor(tee)
                const isLight = color === C.teeWhite || color === '#E9E2D0'
                return (
                  <TouchableOpacity
                    key={tee.id}
                    style={[s.teeCard, isSelected && s.teeCardSelected]}
                    onPress={() => setSelectedTee(tee)}
                  >
                    <View style={[s.teeDot, { backgroundColor: color }, isLight && s.teeDotLight]} />
                    <Text style={[s.teeName, isSelected && s.teeNameSelected]}>
                      {tee.name.split('/')[0]}
                    </Text>
                    <Text style={s.teeYards}>{tee.total_yards?.toLocaleString()}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </>
        )}

        {/* Date + Holes */}
        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>DATE</Text>
            <View style={s.dateBox}>
              <Text style={s.dateMain}>Today</Text>
              <Text style={s.dateSub}>{dateStr}</Text>
              <Ionicons name="chevron-down" size={12} color={C.ink3} style={s.dateChevron} />
            </View>
          </View>
          <View style={s.half}>
            <Text style={s.label}>HOLES</Text>
            <View style={s.holesRow}>
              {([9, 18] as const).map(n => (
                <TouchableOpacity
                  key={n}
                  style={[s.holesBtn, holes === n && s.holesBtnActive]}
                  onPress={() => setHoles(n)}
                >
                  <Text style={[s.holesBtnText, holes === n && s.holesBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Score entry method */}
        <Text style={s.label}>HOW YOU'LL ENTER SCORES</Text>
        <View style={s.methodRow}>
          {/* Total score card */}
          <TouchableOpacity
            style={[s.methodCard, scoreMethod === 'total' && s.methodCardActive]}
            onPress={() => setScoreMethod('total')}
            activeOpacity={0.8}
          >
            {scoreMethod === 'total' && (
              <Ionicons name="checkmark-circle" size={18} color={C.fairway} style={s.methodCheck} />
            )}
            <Text style={s.methodNumber}>84</Text>
            <Text style={s.methodTitle}>Total score</Text>
            <Text style={s.methodSub}>Quick — just the{'\n'}final number</Text>
          </TouchableOpacity>

          {/* Hole-by-hole card */}
          <TouchableOpacity
            style={[s.methodCard, scoreMethod === 'hole' && s.methodCardActive]}
            onPress={() => setScoreMethod('hole')}
            activeOpacity={0.8}
          >
            {scoreMethod === 'hole' && (
              <Ionicons name="checkmark-circle" size={18} color={C.fairway} style={s.methodCheck} />
            )}
            <View style={s.methodDots}>
              {[false, true, true, false].map((filled, i) => (
                <View key={i} style={[s.methodDot, filled && s.methodDotFilled]} />
              ))}
            </View>
            <Text style={s.methodTitle}>Hole-by-hole</Text>
            <Text style={s.methodSub}>Tap as you{'\n'}play</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.startBtn, !canStart && s.startBtnDisabled]}
          onPress={handleStartRound}
          disabled={!canStart}
        >
          <Text style={s.startBtnText}>Start round →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  container: { padding: 24, paddingTop: 64 },

  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.ink3, marginBottom: 10 },
  title: { fontFamily: F.serifBold, fontSize: 38, color: C.ink1, lineHeight: 44 },
  titleItalic: { fontFamily: F.serifBoldItalic, fontSize: 38, color: C.ink1, lineHeight: 44, marginBottom: 32 },

  label: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 8, marginTop: 20 },

  // Search
  searchWrapper: { position: 'relative', zIndex: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.cardBg, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: C.border,
  },
  searchBoxActive: { borderColor: C.fairway },
  courseDot: { width: 10, height: 10, borderRadius: 5 },
  courseDotLight: { borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontFamily: F.sans, fontSize: 15, color: C.ink1, padding: 0 },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    marginTop: 4, zIndex: 20,
    shadowColor: C.ink1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  dropdownName: { fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  dropdownMeta: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },

  // Tees
  teeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  teeInfo: { fontFamily: F.mono, fontSize: 11, color: C.ink3 },
  teeScroll: { marginHorizontal: -24 },
  teeScrollContent: { paddingHorizontal: 24, gap: 10 },
  teeCard: {
    alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 10,
    padding: 12, minWidth: 72, borderWidth: 1.5, borderColor: C.border,
  },
  teeCardSelected: { borderColor: C.ink1 },
  teeDot: { width: 28, height: 28, borderRadius: 14, marginBottom: 6 },
  teeDotLight: { borderWidth: 1, borderColor: C.border },
  teeName: { fontFamily: F.sansMedium, fontSize: 12, color: C.ink3 },
  teeNameSelected: { fontFamily: F.sansSemiBold, color: C.ink1 },
  teeYards: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },

  // Date + holes
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  half: { flex: 1 },
  dateBox: {
    backgroundColor: C.cardBg, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: C.border, position: 'relative',
  },
  dateMain: { fontFamily: F.sansMedium, fontSize: 16, color: C.ink1 },
  dateSub: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 3, letterSpacing: 0.5 },
  dateChevron: { position: 'absolute', right: 12, top: 16 },
  holesRow: { flexDirection: 'row', gap: 8 },
  holesBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border,
  },
  holesBtnActive: { backgroundColor: C.ink1, borderColor: C.ink1 },
  holesBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink3 },
  holesBtnTextActive: { color: C.onDark },

  // Method cards
  methodRow: { flexDirection: 'row', gap: 12 },
  methodCard: {
    flex: 1, backgroundColor: C.cardBg, borderRadius: 12, padding: 16,
    borderWidth: 1.5, borderColor: C.border, minHeight: 148, position: 'relative',
  },
  methodCardActive: { borderColor: C.fairway, backgroundColor: C.insetBg },
  methodCheck: { position: 'absolute', top: 10, right: 10 },
  methodNumber: {
    fontFamily: F.serifBold, fontSize: 40, color: C.ink1, lineHeight: 46, marginBottom: 10,
  },
  methodDots: { flexDirection: 'row', gap: 4, marginBottom: 10, marginTop: 6 },
  methodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.bunker },
  methodDotFilled: { backgroundColor: C.fairway },
  methodTitle: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink1, marginBottom: 4 },
  methodSub: { fontFamily: F.sans, fontSize: 12, color: C.ink2, lineHeight: 17 },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: 40, backgroundColor: C.pageBg,
    borderTopWidth: 1, borderTopColor: C.hairline,
  },
  startBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  startBtnDisabled: { backgroundColor: C.bunker },
  startBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark, letterSpacing: 0.3 },
})