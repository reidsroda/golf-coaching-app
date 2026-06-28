import { JSX, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ImageBackground, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path, Circle, Polygon } from 'react-native-svg'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')
const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

// Compute polygon points for an arrowhead at (toX, toY) coming from (fromX, fromY)
function arrowPoly(fromX: number, fromY: number, toX: number, toY: number, len = 7, w = 3.5) {
  const dx = toX - fromX, dy = toY - fromY
  const d = Math.sqrt(dx * dx + dy * dy)
  const nx = dx / d, ny = dy / d
  const px = -ny, py = nx
  const bx = toX - nx * len, by = toY - ny * len
  return `${toX.toFixed(1)},${toY.toFixed(1)} ${(bx + px * w).toFixed(1)},${(by + py * w).toFixed(1)} ${(bx - px * w).toFixed(1)},${(by - py * w).toFixed(1)}`
}

function BallFlight({ type, color = '#C26B3C' }: { type: string; color?: string }) {
  const size = 64
  const stroke = color
  const sw = '1.5'

  const paths: Record<string, JSX.Element> = {
    Slice: (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M8 50 Q20 45 40 20 L52 10" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(40, 20, 52, 10)} fill={stroke} />
        <Circle cx="8" cy="50" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
      </Svg>
    ),
    Hook: (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M56 50 Q44 45 24 20 L12 10" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(24, 20, 12, 10)} fill={stroke} />
        <Circle cx="56" cy="50" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
      </Svg>
    ),
    Push: (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M8 52 L52 14" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(8, 52, 52, 14)} fill={stroke} />
        <Circle cx="8" cy="52" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
      </Svg>
    ),
    Pull: (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M56 52 L12 14" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(56, 52, 12, 14)} fill={stroke} />
        <Circle cx="56" cy="52" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
      </Svg>
    ),
    Thin: (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M8 52 Q20 48 36 44 L56 42" stroke={stroke} strokeWidth={sw} strokeDasharray="4 2" fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(36, 44, 56, 42)} fill={stroke} />
        <Circle cx="8" cy="52" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
      </Svg>
    ),
    Chunk: (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M8 52 Q14 50 18 54 L20 56" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(18, 54, 20, 56)} fill={stroke} />
        <Circle cx="8" cy="52" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
      </Svg>
    ),
    // Putting misses — includes hole marker
    'Putt Push': (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M8 52 L52 14" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(8, 52, 52, 14)} fill={stroke} />
        <Circle cx="8" cy="52" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
        <Circle cx="32" cy="33" r="5" stroke={stroke} strokeWidth="1" fill="none" strokeDasharray="2 2"/>
      </Svg>
    ),
    'Putt Pull': (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M56 52 L12 14" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(56, 52, 12, 14)} fill={stroke} />
        <Circle cx="56" cy="52" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
        <Circle cx="34" cy="33" r="5" stroke={stroke} strokeWidth="1" fill="none" strokeDasharray="2 2"/>
      </Svg>
    ),
    Pace: (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M8 52 Q24 36 32 8" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <Polygon points={arrowPoly(24, 36, 32, 8)} fill={stroke} />
        <Circle cx="8" cy="52" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
        <Circle cx="32" cy="30" r="5" stroke={stroke} strokeWidth="1" fill="none" strokeDasharray="2 2"/>
      </Svg>
    ),
  }

  return paths[type] || (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M8 52 Q32 30 56 14" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round"/>
      <Polygon points={arrowPoly(32, 30, 56, 14)} fill={stroke} />
      <Circle cx="8" cy="52" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none"/>
    </Svg>
  )
}

const MISS_CATEGORIES = [
  {
    key: 'driving',
    label: 'DRIVING',
    color: C.fairway,
    misses: ['Slice', 'Hook', 'Push', 'Pull'],
  },
  {
    key: 'irons',
    label: 'IRONS',
    color: C.flagYellow,
    misses: ['Slice', 'Hook', 'Thin', 'Push', 'Pull'],
  },
  {
    key: 'wedges',
    label: 'WEDGES',
    color: C.clay,
    misses: ['Thin', 'Chunk', 'Push', 'Pull'],
  },
  {
    key: 'putting',
    label: 'PUTTING',
    color: C.teeBlue,
    misses: ['Putt Push', 'Putt Pull', 'Pace'],
  },
]

// Map display name to canonical save name for putting
function saveName(miss: string): string {
  if (miss === 'Putt Push') return 'Push'
  if (miss === 'Putt Pull') return 'Pull'
  return miss
}

export default function OnboardingCommonMissScreen({ navigation }: any) {
  const [selected, setSelected] = useState<Record<string, string[]>>({
    driving: [], irons: [], wedges: [], putting: [],
  })
  const [saving, setSaving] = useState(false)

  function toggleMiss(category: string, miss: string) {
    setSelected(prev => {
      const current = prev[category] || []
      const next = current.includes(miss)
        ? current.filter(m => m !== miss)
        : [...current, miss]
      return { ...prev, [category]: next }
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const thoughts = Object.entries(selected)
          .filter(([_, misses]) => misses.length > 0)
          .map(([cat, misses]) => ({
            user_id: user.id,
            category: 'problem',
            content: `Common miss — ${cat}: ${misses.map(saveName).join(', ')}`,
            pinned: false,
          }))
        if (thoughts.length > 0) {
          await supabase.from('swing_thoughts').insert(thoughts)
        }
      }
    } catch (e) {
      console.log('Save error:', e)
    }
    setSaving(false)
    navigation.navigate('OnboardingCurrentDrills')
  }

  const cellW = (width - 40 - 24) / 3

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Common miss</Text>
        <Text style={s.stepLabel}>3 / 4</Text>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.eyebrow}>TENDENCIES</Text>
        <Text style={s.title}>What's your{'\n'}<Text style={s.titleItalic}>common miss?</Text></Text>
        <Text style={s.subtitle}>Pick the misses that creep in for each part of your game — choose as many as apply.</Text>
        <Text style={s.pickAny}>PICK ANY</Text>

        {MISS_CATEGORIES.map(cat => (
          <View key={cat.key} style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: cat.color }]} />
              <Text style={[s.sectionLabel, { color: cat.color }]}>{cat.label}</Text>
            </View>
            <View style={s.missGrid}>
              {cat.misses.map(miss => {
                const isSelected = selected[cat.key]?.includes(miss)
                const displayName = miss.startsWith('Putt ') ? miss.replace('Putt ', '') : miss
                return (
                  <TouchableOpacity
                    key={miss}
                    style={[s.missCell, { width: cellW }, isSelected && s.missCellActive]}
                    onPress={() => toggleMiss(cat.key, miss)}
                    activeOpacity={0.75}
                  >
                    {isSelected && (
                      <View style={s.checkmark}>
                        <Ionicons name="checkmark" size={10} color={C.onDark} />
                      </View>
                    )}
                    <BallFlight type={miss} color={isSelected ? cat.color : '#C8B8A2'} />
                    <Text style={[s.missLabel, isSelected && s.missLabelActive]}>{displayName}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save →'}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink1 },
  stepLabel: { fontFamily: F.mono, fontSize: 12, color: C.ink3 },
  container: { padding: 20 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3, marginBottom: 8 },
  title: { fontFamily: F.serifBold, fontSize: 28, color: C.ink1, lineHeight: 34, marginBottom: 10 },
  titleItalic: { fontFamily: F.serifBoldItalic, fontSize: 28 },
  subtitle: { fontFamily: F.sans, fontSize: 14, color: C.ink2, lineHeight: 20, marginBottom: 8 },
  pickAny: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, textAlign: 'right', marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2 },
  missGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  missCell: {
    backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1.5,
    borderColor: C.border, paddingVertical: 10, alignItems: 'center',
    justifyContent: 'center', position: 'relative', gap: 4,
  },
  missCellActive: { borderColor: C.fairwayDark, backgroundColor: C.insetBg },
  checkmark: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.fairwayDark, alignItems: 'center', justifyContent: 'center',
  },
  missLabel: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink1 },
  missLabelActive: { fontFamily: F.sansSemiBold, color: C.fairwayDark },
  footer: { padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: C.hairline, backgroundColor: 'rgba(241,236,224,0.95)' },
  saveBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
})
