import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ImageBackground, Platform, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

const ALL_CLUBS = [
  { name: 'Dr',  label: 'Driver'          },
  { name: '3w',  label: '3 Wood'          },
  { name: '5w',  label: '5 Wood'          },
  { name: '4hy', label: '4 Hybrid'        },
  { name: '5i',  label: '5 Iron'          },
  { name: '6i',  label: '6 Iron'          },
  { name: '7i',  label: '7 Iron'          },
  { name: '8i',  label: '8 Iron'          },
  { name: '9i',  label: '9 Iron'          },
  { name: 'PW',  label: 'Pitching Wedge'  },
  { name: 'GW',  label: 'Gap Wedge'       },
  { name: 'SW',  label: 'Sand Wedge'      },
  { name: 'LW',  label: 'Lob Wedge'       },
  { name: 'Ptr', label: 'Putter'          },
]

const MISS_OPTIONS = ['Straight', 'Slice', 'Hook', 'Chunk', 'Top', 'Fat', 'Thin']

type Club = { name: string; label: string; yardage: number | null; common_miss: string | null }

export default function OnboardingBagScreen({ navigation }: any) {
  const [clubs, setClubs] = useState<Club[]>(
    ALL_CLUBS.map(c => ({ ...c, yardage: null, common_miss: null }))
  )
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [yardageInput, setYardageInput] = useState('')
  const [missInput, setMissInput] = useState('')
  const [saving, setSaving] = useState(false)

  function openClub(club: Club) {
    setSelectedClub(club)
    setYardageInput(club.yardage ? String(club.yardage) : '')
    setMissInput(club.common_miss || '')
    setModalVisible(true)
  }

  function saveClub() {
    if (!selectedClub) return
    const yardage = yardageInput ? parseInt(yardageInput) : null
    setClubs(prev => prev.map(c =>
      c.name === selectedClub.name ? { ...c, yardage, common_miss: missInput || null } : c
    ))
    setModalVisible(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const clubsToInsert = clubs.map(c => ({
            user_id: user.id,
            name: c.name,
            label: c.label,
            yardage: c.yardage,
            common_miss: c.common_miss,
            in_bag: true,
          }))
        await supabase.from('user_clubs').upsert(clubsToInsert, { onConflict: 'user_id,name' })
      }
    } catch (e) {
      console.log('Save error:', e)
    }
    setSaving(false)
    navigation.navigate('OnboardingSwingThoughts')
  }

  const configured = clubs.filter(c => c.yardage).length

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>What's in the bag</Text>
        <Text style={s.stepLabel}>1 / 4</Text>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Add your clubs</Text>
        <Text style={s.subtitle}>Add your clubs and the carry distance for each. Tap any club to set its yardage.</Text>
        <Text style={s.progress}>{configured} of {clubs.length} clubs configured</Text>

        <View style={s.headerRow}>
          <Text style={s.colLabel}>CLUB</Text>
          <Text style={s.colLabel}>CARRY</Text>
        </View>

        <View style={s.clubList}>
          {clubs.map((club, i) => (
            <TouchableOpacity
              key={club.name}
              style={[s.clubRow, i < clubs.length - 1 && s.clubRowBorder]}
              onPress={() => openClub(club)}
              activeOpacity={0.7}
            >
              <View style={s.clubBadge}>
                <Text style={s.clubBadgeText}>{club.name}</Text>
              </View>
              <Text style={s.clubLabel}>{club.label}</Text>
              <View style={s.yardageWrap}>
                {club.yardage ? (
                  <>
                    <Text style={s.yardageValue}>{club.yardage}</Text>
                    <Text style={s.yardageUnit}> YDS</Text>
                    <Ionicons name="pencil" size={12} color={C.fairway} style={{ marginLeft: 6 }} />
                  </>
                ) : (
                  <Text style={s.yardageEmpty}>—</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save bag →'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={m.root}>
          <View style={m.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
            <Text style={m.title}>{selectedClub?.label}</Text>
            <TouchableOpacity onPress={saveClub}><Text style={m.save}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={m.container}>
            <Text style={m.label}>CARRY DISTANCE</Text>
            <View style={m.inputWrap}>
              <TextInput
                style={m.input}
                keyboardType="numeric"
                placeholder="e.g. 260"
                placeholderTextColor={C.ink3}
                value={yardageInput}
                onChangeText={setYardageInput}
                maxLength={3}
                autoFocus
              />
              <Text style={m.unit}>yards</Text>
            </View>
            <Text style={m.label}>MOST COMMON MISS</Text>
            <View style={m.missGrid}>
              {MISS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[m.missBtn, missInput === opt && m.missBtnActive]}
                  onPress={() => setMissInput(opt === missInput ? '' : opt)}
                >
                  <Text style={[m.missBtnText, missInput === opt && m.missBtnTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  title: { fontFamily: F.serifBold, fontSize: 28, color: C.ink1, marginBottom: 8 },
  subtitle: { fontFamily: F.sans, fontSize: 14, color: C.ink2, lineHeight: 20, marginBottom: 8 },
  progress: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  colLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3 },
  clubList: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  clubRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  clubBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.insetBg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  clubBadgeText: { fontFamily: F.monoBold, fontSize: 11, color: C.ink1 },
  clubLabel: { flex: 1, fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  yardageWrap: { flexDirection: 'row', alignItems: 'center' },
  yardageValue: { fontFamily: F.serifBold, fontSize: 18, color: C.ink1 },
  yardageUnit: { fontFamily: F.mono, fontSize: 11, color: C.ink3 },
  yardageEmpty: { fontFamily: F.mono, fontSize: 16, color: C.bunker },
  footer: { padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: C.hairline, backgroundColor: 'rgba(241,236,224,0.95)' },
  saveBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
})

const m = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.hairline },
  cancel: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink2 },
  title: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1, flex: 1, textAlign: 'center' },
  save: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.fairway },
  container: { padding: 24 },
  label: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 12, marginTop: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14 },
  input: { fontFamily: F.serifBold, fontSize: 32, color: C.ink1, flex: 1 },
  unit: { fontFamily: F.mono, fontSize: 13, color: C.ink3 },
  missGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  missBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.border },
  missBtnActive: { backgroundColor: C.fairwayDark, borderColor: C.fairwayDark },
  missBtnText: { fontFamily: F.sansMedium, fontSize: 14, color: C.ink2 },
  missBtnTextActive: { color: C.onDark },
})