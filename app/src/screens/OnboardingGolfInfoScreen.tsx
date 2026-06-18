import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ImageBackground, ScrollView, TextInput, Dimensions,
  PanResponder, Animated, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')
const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

const SLIDER_MIN = -10  // +10 handicap (better than scratch)
const SLIDER_MAX = 36
const SLIDER_RANGE = SLIDER_MAX - SLIDER_MIN
const SLIDER_W = width - 48 - 100 // track width

const STRENGTH_ITEMS = [
  { key: 'driving',  label: 'Driving / Off the tee', sub: 'Tee shots, distance' },
  { key: 'irons',   label: 'Irons',                  sub: 'Approach shots' },
  { key: 'wedges',  label: 'Wedges / Short game',    sub: '<100 yds, chipping' },
  { key: 'putting', label: 'Putting',                 sub: 'On the green' },
]

const RANK_LABELS: Record<number, string> = {
  0: 'STRONGEST',
  1: '2ND',
  2: '3RD',
  3: 'WEAKEST',
}

const RANK_COLORS: Record<number, string> = {
  0: C.fairway,
  1: C.ink2,
  2: C.ink2,
  3: C.errorRed,
}

// Draggable strength ranker
function StrengthRanker({ order, onReorder }: { order: string[]; onReorder: (o: string[]) => void }) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [items, setItems] = useState(order)
  const ITEM_H = 64

  useEffect(() => { setItems(order) }, [order])

  function moveUp(idx: number) {
    if (idx === 0) return
    const next = [...items]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setItems(next)
    onReorder(next)
  }

  function moveDown(idx: number) {
    if (idx === items.length - 1) return
    const next = [...items]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setItems(next)
    onReorder(next)
  }

  return (
    <View style={sr.list}>
      {items.map((key, idx) => {
        const item = STRENGTH_ITEMS.find(s => s.key === key)!
        const rankLabel = RANK_LABELS[idx]
        const rankColor = RANK_COLORS[idx]
        return (
          <View key={key} style={sr.row}>
            <View style={[sr.rankNum, { borderColor: rankColor }]}>
              <Text style={[sr.rankNumText, { color: rankColor }]}>{idx + 1}</Text>
            </View>
            <View style={sr.itemInfo}>
              <View style={sr.itemTop}>
                <Text style={sr.itemLabel}>{item.label}</Text>
                <View style={[sr.rankBadge, { backgroundColor: rankColor + '22' }]}>
                  <Text style={[sr.rankBadgeText, { color: rankColor }]}>{rankLabel}</Text>
                </View>
              </View>
              <Text style={sr.itemSub}>{item.sub}</Text>
            </View>
            <View style={sr.arrows}>
              <TouchableOpacity onPress={() => moveUp(idx)} disabled={idx === 0} style={sr.arrowBtn}>
                <Ionicons name="chevron-up" size={16} color={idx === 0 ? C.bunker : C.ink2} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => moveDown(idx)} disabled={idx === items.length - 1} style={sr.arrowBtn}>
                <Ionicons name="chevron-down" size={16} color={idx === items.length - 1 ? C.bunker : C.ink2} />
              </TouchableOpacity>
            </View>
            <Ionicons name="reorder-three-outline" size={20} color={C.ink3} style={{ marginLeft: 4 }} />
          </View>
        )
      })}
    </View>
  )
}

const sr = StyleSheet.create({
  list: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.hairline },
  rankNum: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rankNumText: { fontFamily: F.sansBold, fontSize: 13 },
  itemInfo: { flex: 1 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  itemLabel: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink1 },
  rankBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  rankBadgeText: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.5 },
  itemSub: { fontFamily: F.sans, fontSize: 12, color: C.ink3 },
  arrows: { gap: 0 },
  arrowBtn: { padding: 4 },
})

export default function OnboardingGolfInfoScreen({ navigation }: any) {
  const [courseQuery, setCourseQuery] = useState('')
  const [courseResults, setCourseResults] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [handicap, setHandicap] = useState(18)
  const [handicapInput, setHandicapInput] = useState('18')
  const [editingHandicap, setEditingHandicap] = useState(false)
  const [strengthOrder, setStrengthOrder] = useState(['driving', 'irons', 'wedges', 'putting'])
  const [loading, setLoading] = useState(false)

  const sliderX = useRef(new Animated.Value(((handicap - SLIDER_MIN) / SLIDER_RANGE) * SLIDER_W)).current

  async function searchCourses(text: string) {
    setCourseQuery(text)
    setSelectedCourse(null)
    if (text.length < 2) { setCourseResults([]); setShowDropdown(false); return }
    const { data } = await supabase
      .from('courses')
      .select('id, name, city, state')
      .ilike('name', `%${text}%`)
      .limit(8)
    setCourseResults(data || [])
    setShowDropdown(true)
  }

  function handleSlider(gestureX: number) {
    const clamped = Math.max(0, Math.min(SLIDER_W, gestureX))
    const newHdcp = Math.round(SLIDER_MIN + (clamped / SLIDER_W) * SLIDER_RANGE)
    setHandicap(newHdcp)
    setHandicapInput(String(newHdcp))
    sliderX.setValue(clamped)
  }

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => handleSlider(e.nativeEvent.locationX),
    onPanResponderMove: (_, gs) => {
      const baseX = ((handicap - SLIDER_MIN) / SLIDER_RANGE) * SLIDER_W
      handleSlider(baseX + gs.dx)
    },
  })).current

  async function handleContinue() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').upsert({
          id: user.id,
          home_course: selectedCourse?.name || courseQuery || null,
          handicap_index: handicap,
          strength_order: JSON.stringify(strengthOrder),
        })
      }
    } catch (e) {
      // Continue even if save fails
      console.log('Save error:', e)
    }
    setLoading(false)
    navigation.navigate('OnboardingMore')
  }

  const thumbPos = ((handicap - SLIDER_MIN) / SLIDER_RANGE) * SLIDER_W

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <View style={s.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.ink1} />
          </TouchableOpacity>
          <View style={s.dots}>
            <View style={s.dot} />
            <View style={[s.dot, s.dotActive]} />
            <View style={s.dot} />
            <View style={s.dot} />
          </View>
        </View>

        <Text style={s.eyebrow}>YOUR GOLF</Text>
        <Text style={s.title}>Tell us about</Text>
        <Text style={s.titleItalic}>your game.</Text>

        {/* Home course */}
        <Text style={s.label}>HOME COURSE</Text>
        <View style={s.searchWrap}>
          <View style={[s.searchBox, selectedCourse && s.searchBoxActive]}>
            {selectedCourse && <View style={s.courseDot} />}
            <TextInput
              style={s.searchInput}
              placeholder="Search courses…"
              placeholderTextColor={C.ink3}
              value={courseQuery}
              onChangeText={searchCourses}
              onFocus={() => courseQuery.length >= 2 && setShowDropdown(true)}
            />
            <Ionicons name="search-outline" size={16} color={C.ink3} />
          </View>
          {showDropdown && courseResults.length > 0 && (
            <View style={s.dropdown}>
              {courseResults.map((c, i) => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.dropdownItem, i < courseResults.length - 1 && s.dropdownBorder]}
                  onPress={() => {
                    setSelectedCourse(c)
                    setCourseQuery(c.name)
                    setShowDropdown(false)
                  }}
                >
                  <Text style={s.dropdownName}>{c.name}</Text>
                  <Text style={s.dropdownMeta}>{c.city}, {c.state}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Handicap slider */}
        <Text style={s.label}>APPROXIMATE HANDICAP</Text>
        <View style={s.hdcpCard}>
          <TouchableOpacity onPress={() => setEditingHandicap(true)} style={s.hdcpNumWrap}>
            {editingHandicap ? (
              <TextInput
                style={s.hdcpInput}
                value={handicapInput}
                onChangeText={t => {
                  setHandicapInput(t)
                  const v = parseInt(t)
                  if (!isNaN(v) && v >= SLIDER_MIN && v <= SLIDER_MAX) {
                    setHandicap(v)
                    sliderX.setValue(((v - SLIDER_MIN) / SLIDER_RANGE) * SLIDER_W)
                  }
                }}
                onBlur={() => setEditingHandicap(false)}
                keyboardType="numbers-and-punctuation"
                autoFocus
                maxLength={4}
              />
            ) : (
              <Text style={s.hdcpNum}>{handicap > 0 ? handicap : handicap === 0 ? 'E' : `+${Math.abs(handicap)}`}</Text>
            )}
          </TouchableOpacity>

          {/* Slider track */}
          <View style={s.sliderWrap} {...panResponder.panHandlers}>
            <View style={s.sliderTrack}>
              <View style={[s.sliderFill, { width: thumbPos }]} />
            </View>
            <View style={[s.sliderThumb, { left: thumbPos - 10 }]} />
          </View>

          <View style={s.sliderLabels}>
            <Text style={s.sliderLabel}>+10 · SCRATCH</Text>
            <Text style={s.sliderLabel}>36</Text>
          </View>
        </View>

        {handicap > 20 && (
          <Text style={s.hdcpNote}>Don't know? Estimate — we'll refine it as you log rounds.</Text>
        )}

        {/* Strength ranking */}
        <Text style={s.label}>RANK YOUR GAME</Text>
        <Text style={s.rankSub}>Drag to reorder — strongest on top, weakest at the bottom.</Text>
        <StrengthRanker order={strengthOrder} onReorder={setStrengthOrder} />

      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.continueBtn} onPress={handleContinue} disabled={loading}>
          <Text style={s.continueBtnText}>{loading ? 'Saving…' : 'Continue →'}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg, flexDirection: 'column' },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  container: { padding: 24, paddingTop: 56 },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 20, height: 4, borderRadius: 2, backgroundColor: C.bunker },
  dotActive: { width: 32, backgroundColor: C.fairway },

  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3, marginBottom: 6 },
  title: { fontFamily: F.serifBold, fontSize: 34, color: C.ink1, lineHeight: 40 },
  titleItalic: { fontFamily: F.serifBoldItalic, fontSize: 34, color: C.ink1, lineHeight: 40, marginBottom: 28 },
  label: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 10, marginTop: 20 },

  // Course search
  searchWrap: { position: 'relative', zIndex: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cardBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: C.border },
  searchBoxActive: { borderColor: C.fairway },
  courseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.fairway },
  searchInput: { flex: 1, fontFamily: F.sans, fontSize: 15, color: C.ink1, padding: 0 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginTop: 4, zIndex: 20, shadowColor: C.ink1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  dropdownName: { fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  dropdownMeta: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },

  // Handicap
  hdcpCard: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  hdcpNumWrap: { marginBottom: 16 },
  hdcpNum: { fontFamily: F.serifBold, fontSize: 52, color: C.ink1, lineHeight: 58 },
  hdcpInput: { fontFamily: F.serifBold, fontSize: 52, color: C.ink1, lineHeight: 58, padding: 0 },
  sliderWrap: { height: 32, justifyContent: 'center', position: 'relative' },
  sliderTrack: { height: 4, backgroundColor: C.insetBg, borderRadius: 2, overflow: 'hidden' },
  sliderFill: { height: 4, backgroundColor: C.fairway, borderRadius: 2 },
  sliderThumb: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: C.fairway, top: 6, shadowColor: C.fairway, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sliderLabel: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  hdcpNote: { fontFamily: F.sans, fontSize: 12, color: C.ink3, fontStyle: 'italic', marginTop: 8 },

  // Rank sub
  rankSub: { fontFamily: F.sans, fontSize: 13, color: C.ink2, marginBottom: 12, marginTop: -4 },

  footer: { padding: 24, paddingBottom: 40, backgroundColor: 'rgba(241,236,224,0.92)', borderTopWidth: 1, borderTopColor: C.hairline },
  continueBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  continueBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
})