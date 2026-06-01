import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, ImageBackground
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')
const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

type Course = { id: string; name: string; course_name: string | null; city: string; state: string }
type ClubResult = { name: string; city: string; state: string; courses: Course[] }
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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function CalendarPicker({ selectedDate, onSelect, onClose }: {
  selectedDate: Date
  onSelect: (d: Date) => void
  onClose: () => void
}) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)

  const currentYear = now.getFullYear()
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function isSelected(day: number) {
    return selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
  }

  function isToday(day: number) {
    return now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
  }

  function isFuture(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    d.setHours(0,0,0,0)
    const t = new Date(); t.setHours(0,0,0,0)
    return d > t
  }

  return (
    <View style={cal.container}>
      {/* Header */}
      <View style={cal.header}>
        <TouchableOpacity style={cal.arrowBtn} onPress={prevMonth}>
          <Ionicons name="chevron-back" size={18} color={C.ink1} />
        </TouchableOpacity>

        <View style={cal.headerCenter}>
          {/* Month picker trigger */}
          <TouchableOpacity
            style={cal.headerLabelBtn}
            onPress={() => { setShowMonthPicker(m => !m); setShowYearPicker(false) }}
          >
            <Text style={cal.headerMonth}>{MONTHS[viewMonth]}</Text>
            <Ionicons name="chevron-down" size={12} color={C.ink2} style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          {/* Year picker trigger */}
          <TouchableOpacity
            style={[cal.headerLabelBtn, { marginLeft: 6 }]}
            onPress={() => { setShowYearPicker(y => !y); setShowMonthPicker(false) }}
          >
            <Text style={cal.headerYear}>{viewYear}</Text>
            <Ionicons name="chevron-down" size={12} color={C.ink2} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={cal.arrowBtn} onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={18} color={C.ink1} />
        </TouchableOpacity>
      </View>

      {/* Month dropdown */}
      {showMonthPicker && (
        <View style={cal.pickerDropdown}>
          <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
            {MONTHS.map((m, i) => (
              <TouchableOpacity
                key={m}
                style={[cal.pickerItem, i === viewMonth && cal.pickerItemActive]}
                onPress={() => { setViewMonth(i); setShowMonthPicker(false) }}
              >
                <Text style={[cal.pickerItemText, i === viewMonth && cal.pickerItemTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Year dropdown */}
      {showYearPicker && (
        <View style={cal.pickerDropdown}>
          <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
            {years.map(y => (
              <TouchableOpacity
                key={y}
                style={[cal.pickerItem, y === viewYear && cal.pickerItemActive]}
                onPress={() => { setViewYear(y); setShowYearPicker(false) }}
              >
                <Text style={[cal.pickerItemText, y === viewYear && cal.pickerItemTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Day headers */}
      <View style={cal.dayHeaders}>
        {DAYS.map(d => (
          <Text key={d} style={cal.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={cal.grid}>
        {cells.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[
              cal.cell,
              day ? (isSelected(day) ? cal.cellSelected : undefined) : undefined,
              day ? (!isSelected(day) && isToday(day) ? cal.cellToday : undefined) : undefined,
            ]}
            onPress={() => {
              if (!day || isFuture(day)) return
              onSelect(new Date(viewYear, viewMonth, day))
              onClose()
            }}
            disabled={!day || isFuture(day)}
          >
            {day ? (
              <Text style={[
                cal.cellText,
                isSelected(day) && cal.cellTextSelected,
                isToday(day) && !isSelected(day) && cal.cellTextToday,
                isFuture(day) && cal.cellTextDisabled,
              ]}>
                {day}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Today shortcut */}
      <TouchableOpacity
        style={cal.todayBtn}
        onPress={() => { onSelect(new Date()); onClose() }}
      >
        <Text style={cal.todayBtnText}>Today</Text>
      </TouchableOpacity>
    </View>
  )
}

const cal = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginTop: 4,
    shadowColor: C.ink1, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
    zIndex: 30,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  arrowBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: C.insetBg },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerLabelBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  headerMonth: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },
  headerYear: { fontFamily: F.mono, fontSize: 14, color: C.ink2 },
  pickerDropdown: {
    position: 'absolute', top: 46, left: 14, right: 14,
    backgroundColor: C.cardBg, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, zIndex: 40,
    shadowColor: C.ink1, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 16 },
  pickerItemActive: { backgroundColor: C.insetBg },
  pickerItemText: { fontFamily: F.sans, fontSize: 14, color: C.ink1 },
  pickerItemTextActive: { fontFamily: F.sansSemiBold, color: C.fairway },
  dayHeaders: { flexDirection: 'row', marginBottom: 6 },
  dayHeader: { flex: 1, textAlign: 'center', fontFamily: F.mono, fontSize: 10, color: C.ink3, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  cellSelected: { backgroundColor: C.fairwayDark },
  cellToday: { backgroundColor: C.insetBg, borderWidth: 1, borderColor: C.fairway },
  cellText: { fontFamily: F.sans, fontSize: 13, color: C.ink1 },
  cellTextSelected: { color: C.onDark, fontFamily: F.sansSemiBold },
  cellTextToday: { color: C.fairway, fontFamily: F.sansSemiBold },
  cellTextDisabled: { color: C.ink3, opacity: 0.4 },
  todayBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.hairline },
  todayBtnText: { fontFamily: F.sansMedium, fontSize: 13, color: C.fairway },
})

export default function AddRoundScreen({ navigation }: any) {
  const [query, setQuery] = useState('')
  const [clubs, setClubs] = useState<ClubResult[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedClub, setSelectedClub] = useState<ClubResult | null>(null)
  const [teeSets, setTeeSets] = useState<TeeSet[]>([])
  const [selectedTee, setSelectedTee] = useState<TeeSet | null>(null)
  const [holes, setHoles] = useState<9 | 18>(18)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [scoreMethod, setScoreMethod] = useState<'total' | 'hole' | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)

  function formatDate(d: Date): string {
    const isToday = new Date().toDateString() === d.toDateString()
    if (isToday) return 'Today'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatDateSub(d: Date): string {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
  }

  async function searchCourses(text: string) {
    setQuery(text)
    setSelectedCourse(null)
    setSelectedClub(null)
    setTeeSets([])
    setSelectedTee(null)
    if (text.length < 2) { setClubs([]); setShowDropdown(false); return }
    setSearching(true)
    const { data } = await supabase
      .from('courses')
      .select('id, name, course_name, city, state')
      .ilike('name', `%${text}%`)
      .limit(20)
    const grouped = new Map<string, ClubResult>()
    for (const c of (data || [])) {
      const key = `${c.name}||${c.city}||${c.state}`
      if (!grouped.has(key)) grouped.set(key, { name: c.name, city: c.city, state: c.state, courses: [] })
      grouped.get(key)!.courses.push(c)
    }
    setClubs(Array.from(grouped.values()))
    setShowDropdown(true)
    setSearching(false)
  }

  async function selectClub(club: ClubResult) {
    setShowDropdown(false)
    setClubs([])
    if (club.courses.length === 1) await selectCourse(club.courses[0], club)
    else { setSelectedClub(club); setQuery(club.name) }
  }

  async function selectCourse(course: Course, club?: ClubResult) {
    setSelectedCourse(course)
    setSelectedClub(club || selectedClub)
    setQuery(club?.name || selectedClub?.name || course.name)
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
    const dateStr = selectedDate.toISOString().split('T')[0]
    const { data, error } = await supabase.from('rounds').insert({
      user_id: user.id, course_id: selectedCourse.id, course_name: selectedCourse.name,
      tee_set_id: selectedTee.id, date: dateStr, holes,
      total_score: 0, total_putts: 0, fairways_hit: 0, gir: 0, penalties: 0,
    }).select().single()
    if (error || !data) return
    navigation.navigate('EnterScores', { round: data, holes, tee: selectedTee, course: selectedCourse, mode: scoreMethod })
  }

  const canStart = selectedCourse && selectedTee && scoreMethod
  const filteredTees = teeSets.filter(t => holes === 9 ? true : (t.total_yards || 0) > 2000)

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => { setShowDropdown(false); setShowCalendar(false) }}
      >
        <Text style={s.eyebrow}>NEW ROUND</Text>
        <Text style={s.title}>Tell us about</Text>
        <Text style={s.titleItalic}>your round.</Text>

        {/* Course search */}
        <Text style={s.label}>COURSE</Text>
        <View style={s.searchWrapper}>
          <View style={[s.searchBox, selectedCourse && s.searchBoxActive]}>
            {selectedCourse && selectedTee && (
              <View style={[s.courseDot, { backgroundColor: getTeeColor(selectedTee) },
                getTeeColor(selectedTee) === C.teeWhite ? s.courseDotLight : null
              ]} />
            )}
            <TextInput
              style={s.searchInput}
              placeholder="Search courses…"
              placeholderTextColor={C.ink3}
              value={query}
              onChangeText={searchCourses}
              onFocus={() => { query.length >= 2 && setShowDropdown(true); setShowCalendar(false) }}
            />
            {searching
              ? <Ionicons name="ellipsis-horizontal" size={16} color={C.ink3} />
              : <Ionicons name="search-outline" size={16} color={C.ink3} />
            }
          </View>

          {showDropdown && clubs.length > 0 && (
            <View style={s.dropdown}>
              {clubs.map((club, i) => (
                <TouchableOpacity
                  key={`${club.name}-${i}`}
                  style={[s.dropdownItem, i < clubs.length - 1 && s.dropdownBorder]}
                  onPress={() => selectClub(club)}
                >
                  <View style={s.dropdownRow}>
                    <View style={s.dropdownLeft}>
                      <Text style={s.dropdownName}>{club.name}</Text>
                      <Text style={s.dropdownMeta}>{club.city}, {club.state}</Text>
                    </View>
                    {club.courses.length > 1 && (
                      <View style={s.multiCourseBadge}>
                        <Text style={s.multiCourseBadgeText}>{club.courses.length} courses</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Multi-course picker */}
        {selectedClub && selectedClub.courses.length > 1 && !selectedCourse && (
          <>
            <Text style={s.label}>WHICH COURSE?</Text>
            <View style={s.coursePickerList}>
              {selectedClub.courses.map((course, i) => (
                <TouchableOpacity
                  key={course.id}
                  style={[s.coursePickerItem, i < selectedClub.courses.length - 1 && s.coursePickerBorder]}
                  onPress={() => selectCourse(course)}
                >
                  <Text style={s.coursePickerName}>{course.course_name || course.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.ink3} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedCourse && selectedClub && selectedClub.courses.length > 1 && (
          <View style={s.selectedCourseRow}>
            <Text style={s.selectedCourseName}>{selectedCourse.course_name || selectedCourse.name}</Text>
            <TouchableOpacity onPress={() => { setSelectedCourse(null); setTeeSets([]); setSelectedTee(null) }}>
              <Text style={s.changeCourse}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.teeScroll} contentContainerStyle={s.teeScrollContent}>
              {filteredTees.map((tee) => {
                const isSelected = selectedTee?.id === tee.id
                const color = getTeeColor(tee)
                return (
                  <TouchableOpacity key={tee.id} style={[s.teeCard, isSelected && s.teeCardSelected]} onPress={() => setSelectedTee(tee)}>
                    <View style={[s.teeDot, { backgroundColor: color }, color === C.teeWhite ? s.teeDotLight : null]} />
                    <Text style={[s.teeName, isSelected && s.teeNameSelected]}>{tee.name.split('/')[0]}</Text>
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
            <TouchableOpacity
              style={[s.dateBox, showCalendar && s.dateBoxActive]}
              onPress={() => { setShowCalendar(c => !c); setShowDropdown(false) }}
            >
              <Text style={s.dateMain}>{formatDate(selectedDate)}</Text>
              <Text style={s.dateSub}>{formatDateSub(selectedDate)}</Text>
              <Ionicons
                name={showCalendar ? 'chevron-up' : 'chevron-down'}
                size={12} color={C.ink3} style={s.dateChevron}
              />
            </TouchableOpacity>
          </View>
          <View style={s.half}>
            <Text style={s.label}>HOLES</Text>
            <View style={s.holesRow}>
              {([9, 18] as const).map(n => (
                <TouchableOpacity key={n} style={[s.holesBtn, holes === n && s.holesBtnActive]} onPress={() => setHoles(n)}>
                  <Text style={[s.holesBtnText, holes === n && s.holesBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Calendar dropdown — spans full width below the row */}
        {showCalendar && (
          <CalendarPicker
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            onClose={() => setShowCalendar(false)}
          />
        )}

        {/* Score entry method */}
        <Text style={s.label}>HOW YOU'LL ENTER SCORES</Text>
        <View style={s.methodRow}>
          <TouchableOpacity style={[s.methodCard, scoreMethod === 'total' && s.methodCardActive]} onPress={() => setScoreMethod('total')} activeOpacity={0.8}>
            {scoreMethod === 'total' && <Ionicons name="checkmark-circle" size={18} color={C.fairway} style={s.methodCheck} />}
            <Text style={s.methodNumber}>72</Text>
            <Text style={s.methodTitle}>Total score</Text>
            <Text style={s.methodSub}>Quick — just the{'\n'}final number</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.methodCard, scoreMethod === 'hole' && s.methodCardActive]} onPress={() => setScoreMethod('hole')} activeOpacity={0.8}>
            {scoreMethod === 'hole' && <Ionicons name="checkmark-circle" size={18} color={C.fairway} style={s.methodCheck} />}
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
        <TouchableOpacity style={[s.startBtn, !canStart && s.startBtnDisabled]} onPress={handleStartRound} disabled={!canStart}>
          <Text style={s.startBtnText}>Start round →</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  container: { padding: 24, paddingTop: 64 },

  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.ink3, marginBottom: 10 },
  title: { fontFamily: F.serifBold, fontSize: 38, color: C.ink1, lineHeight: 44 },
  titleItalic: { fontFamily: F.serifBoldItalic, fontSize: 38, color: C.ink1, lineHeight: 44, marginBottom: 32 },
  label: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 8, marginTop: 20 },

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
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 13 },
  dropdownBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownLeft: { flex: 1 },
  dropdownName: { fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  dropdownMeta: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },
  multiCourseBadge: {
    backgroundColor: C.insetBg, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.border, marginLeft: 8,
  },
  multiCourseBadgeText: { fontFamily: F.mono, fontSize: 10, color: C.ink2 },

  coursePickerList: { backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  coursePickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  coursePickerBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  coursePickerName: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink1 },
  selectedCourseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 2 },
  selectedCourseName: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink1 },
  changeCourse: { fontFamily: F.sansMedium, fontSize: 13, color: C.fairway },

  teeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  teeInfo: { fontFamily: F.mono, fontSize: 11, color: C.ink3 },
  teeScroll: { marginHorizontal: -24 },
  teeScrollContent: { paddingHorizontal: 24, gap: 10 },
  teeCard: { alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 10, padding: 12, minWidth: 72, borderWidth: 1.5, borderColor: C.border },
  teeCardSelected: { borderColor: C.ink1 },
  teeDot: { width: 28, height: 28, borderRadius: 14, marginBottom: 6 },
  teeDotLight: { borderWidth: 1, borderColor: C.border },
  teeName: { fontFamily: F.sansMedium, fontSize: 12, color: C.ink3 },
  teeNameSelected: { fontFamily: F.sansSemiBold, color: C.ink1 },
  teeYards: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },

  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  half: { flex: 1 },
  dateBox: {
    backgroundColor: C.cardBg, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: C.border, position: 'relative',
  },
  dateBoxActive: { borderColor: C.fairway },
  dateMain: { fontFamily: F.sansMedium, fontSize: 16, color: C.ink1 },
  dateSub: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 3, letterSpacing: 0.5 },
  dateChevron: { position: 'absolute', right: 12, top: 16 },
  holesRow: { flexDirection: 'row', gap: 8 },
  holesBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border },
  holesBtnActive: { backgroundColor: C.ink1, borderColor: C.ink1 },
  holesBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink3 },
  holesBtnTextActive: { color: C.onDark },

  methodRow: { flexDirection: 'row', gap: 12 },
  methodCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: C.border, minHeight: 148, position: 'relative' },
  methodCardActive: { borderColor: C.fairway, backgroundColor: C.insetBg },
  methodCheck: { position: 'absolute', top: 10, right: 10 },
  methodNumber: { fontFamily: F.serifBold, fontSize: 40, color: C.ink1, lineHeight: 46, marginBottom: 10 },
  methodDots: { flexDirection: 'row', gap: 4, marginBottom: 10, marginTop: 6 },
  methodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.bunker },
  methodDotFilled: { backgroundColor: C.fairway },
  methodTitle: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink1, marginBottom: 4 },
  methodSub: { fontFamily: F.sans, fontSize: 12, color: C.ink2, lineHeight: 17 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: 40,
    backgroundColor: 'rgba(241,236,224,0.92)',
    borderTopWidth: 1, borderTopColor: C.hairline,
  },
  startBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  startBtnDisabled: { backgroundColor: C.bunker },
  startBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark, letterSpacing: 0.3 },
})