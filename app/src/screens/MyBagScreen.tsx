import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Dimensions, Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')

// Club images from Cloudinary or public CDN
const CLUB_IMAGES: Record<string, string> = {
  'Dr':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/driver.png',
  '3w':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/3wood.png',
  '5w':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/5wood.png',
  '4hy': 'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/hybrid.png',
  '5i':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/iron.png',
  '6i':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/iron.png',
  '7i':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/iron.png',
  '8i':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/iron.png',
  '9i':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/iron.png',
  'PW':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/wedge.png',
  'GW':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/wedge.png',
  'SW':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/wedge.png',
  'LW':  'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/wedge.png',
  'Ptr': 'https://res.cloudinary.com/dtihqaiut/image/upload/v1/clubs/putter.png',
}

// Club type icons using Ionicons as fallback (since we can't guarantee CDN images)
const CLUB_ICONS: Record<string, { name: string; color: string }> = {
  'Dr':  { name: 'arrow-up-circle',    color: '#1E2A24' },
  '3w':  { name: 'golf-outline',       color: '#2F5A3E' },
  '5w':  { name: 'golf-outline',       color: '#2F5A3E' },
  '4hy': { name: 'git-merge-outline',  color: '#2E5C8A' },
  '5i':  { name: 'remove-outline',     color: '#5C6B5F' },
  '6i':  { name: 'remove-outline',     color: '#5C6B5F' },
  '7i':  { name: 'remove-outline',     color: '#5C6B5F' },
  '8i':  { name: 'remove-outline',     color: '#5C6B5F' },
  '9i':  { name: 'remove-outline',     color: '#5C6B5F' },
  'PW':  { name: 'chevron-down-circle',color: '#C26B3C' },
  'GW':  { name: 'chevron-down-circle',color: '#C26B3C' },
  'SW':  { name: 'chevron-down-circle',color: '#C9A23E' },
  'LW':  { name: 'chevron-down-circle',color: '#C9A23E' },
  'Ptr': { name: 'radio-button-on',    color: '#1E2A24' },
}

const ALL_CLUBS = [
  { name: 'Dr',   label: 'Driver'          },
  { name: '3w',   label: '3 Wood'          },
  { name: '5w',   label: '5 Wood'          },
  { name: '4hy',  label: '4 Hybrid'        },
  { name: '5i',   label: '5 Iron'          },
  { name: '6i',   label: '6 Iron'          },
  { name: '7i',   label: '7 Iron'          },
  { name: '8i',   label: '8 Iron'          },
  { name: '9i',   label: '9 Iron'          },
  { name: 'PW',   label: 'Pitching Wedge'  },
  { name: 'GW',   label: 'Gap Wedge'       },
  { name: 'SW',   label: 'Sand Wedge'      },
  { name: 'LW',   label: 'Lob Wedge'       },
  { name: 'Ptr',  label: 'Putter'          },
]

const MISS_OPTIONS = ['Straight', 'Slice', 'Hook', 'Chunk', 'Top', 'Fat', 'Thin']

type Club = {
  id?: string
  name: string
  label: string
  yardage: number | null
  common_miss: string | null
  in_bag: boolean
}

export default function MyBagScreen({ navigation }: any) {
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [addVisible, setAddVisible] = useState(false)
  const [yardageInput, setYardageInput] = useState('')
  const [missInput, setMissInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadBag() }, [])

  async function loadBag() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if user has ANY clubs (including unconfigured)
    const { data: existing } = await supabase
      .from('user_clubs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (existing && existing.length > 0) {
      // Show all in-bag clubs
      setClubs(existing.filter((c: any) => c.in_bag !== false))
    } else {
      // First time with no onboarding — seed default bag
      const defaults = ALL_CLUBS.map(c => ({
        ...c, yardage: null, common_miss: null, in_bag: true
      }))
      const { data: inserted } = await supabase
        .from('user_clubs')
        .insert(defaults.map(c => ({ ...c, user_id: user.id })))
        .select()
      setClubs(inserted || defaults)
    }
    setLoading(false)
  }

  async function saveClub() {
    if (!selectedClub) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const yardage = yardageInput ? parseInt(yardageInput) : null
    const updated = { ...selectedClub, yardage, common_miss: missInput || null }

    if (selectedClub.id) {
      await supabase.from('user_clubs')
        .update({ yardage, common_miss: missInput || null })
        .eq('id', selectedClub.id)
    } else {
      const { data } = await supabase.from('user_clubs').insert({
        user_id: user.id, name: selectedClub.name, label: selectedClub.label,
        yardage, common_miss: missInput || null, in_bag: true,
      }).select().single()
      if (data) updated.id = data.id
    }

    setClubs(prev => prev.map(c => c.name === updated.name ? updated : c))
    setDetailVisible(false)
  }

  async function removeClub(club: Club) {
    Alert.alert('Remove Club', `Remove ${club.label} from your bag?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          if (club.id) {
            await supabase.from('user_clubs').update({ in_bag: false }).eq('id', club.id)
          }
          setClubs(prev => prev.filter(c => c.name !== club.name))
        }
      }
    ])
  }

  async function addClub(clubDef: { name: string; label: string }) {
    if (clubs.find(c => c.name === clubDef.name)) {
      Alert.alert('Already in bag', `${clubDef.label} is already in your bag.`)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newClub = { ...clubDef, yardage: null, common_miss: null, in_bag: true }
    const { data } = await supabase.from('user_clubs').insert({
      user_id: user.id, ...newClub
    }).select().single()

    setClubs(prev => [...prev, data || newClub])
    setAddVisible(false)
  }

  function openClub(club: Club) {
    setSelectedClub(club)
    setYardageInput(club.yardage ? String(club.yardage) : '')
    setMissInput(club.common_miss || '')
    setDetailVisible(true)
  }

  const configured = clubs.filter(c => c.yardage)
  const availableToAdd = ALL_CLUBS.filter(c => !clubs.find(b => b.name === c.name))

  function ClubIcon({ name }: { name: string }) {
    const icon = CLUB_ICONS[name] || { name: 'golf-outline', color: C.ink2 }
    return (
      <View style={ci.wrap}>
        <Ionicons name={icon.name as any} size={22} color={icon.color} />
        <Text style={[ci.label, { color: icon.color }]}>{name}</Text>
      </View>
    )
  }

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>My Bag</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setAddVisible(true)}>
          <Ionicons name="add" size={20} color={C.fairway} />
          <Text style={s.addBtnText}>Add club</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.subtitle}>Tap a club to set your yardage and most common miss.</Text>
        <Text style={s.progress}>{configured.length} of {clubs.length} clubs configured</Text>

        <View style={s.clubList}>
          {clubs.map((club, i) => (
            <View key={club.name} style={[s.clubRow, i < clubs.length - 1 && s.clubRowBorder]}>
              {/* Check circle */}
              <TouchableOpacity style={[s.checkCircle, club.yardage ? s.checkCircleActive : null]} onPress={() => openClub(club)}>
                <Ionicons
                  name={club.yardage ? 'checkmark' : 'ellipse-outline'}
                  size={15}
                  color={club.yardage ? C.onDark : C.ink3}
                />
              </TouchableOpacity>

              {/* Club icon */}
              <TouchableOpacity style={s.clubIconWrap} onPress={() => openClub(club)}>
                <ClubIcon name={club.name} />
              </TouchableOpacity>

              {/* Name & miss */}
              <TouchableOpacity style={s.clubInfo} onPress={() => openClub(club)}>
                <Text style={s.clubName}>{club.label}</Text>
                {club.common_miss && (
                  <Text style={s.clubMiss}>{club.common_miss}</Text>
                )}
              </TouchableOpacity>

              {/* Yardage */}
              <TouchableOpacity style={s.clubYardage} onPress={() => openClub(club)}>
                {club.yardage ? (
                  <View style={s.yardageRow}>
                    <Text style={s.yardageValue}>{club.yardage}</Text>
                    <Text style={s.yardageUnit}> Yds</Text>
                    <Ionicons name="pencil" size={12} color={C.fairway} style={{ marginLeft: 4 }} />
                  </View>
                ) : (
                  <Text style={s.yardageEmpty}>Set yds</Text>
                )}
              </TouchableOpacity>

              {/* Delete button */}
              <TouchableOpacity style={s.deleteBtn} onPress={() => removeClub(club)}>
                <Ionicons name="trash-outline" size={16} color={C.errorRed} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {clubs.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>Your bag is empty. Tap "Add club" to get started.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Club detail modal */}
      <Modal visible={detailVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={m.root}>
          <View style={m.header}>
            <TouchableOpacity onPress={() => setDetailVisible(false)}>
              <Text style={m.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={m.title}>{selectedClub?.label}</Text>
            <TouchableOpacity onPress={saveClub}>
              <Text style={m.save}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={m.container}>
            <Text style={m.sectionLabel}>CARRY DISTANCE</Text>
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
              <Text style={m.inputUnit}>yards</Text>
            </View>
            <Text style={m.sectionLabel}>MOST COMMON MISS</Text>
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

      {/* Add club modal */}
      <Modal visible={addVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={m.root}>
          <View style={m.header}>
            <TouchableOpacity onPress={() => setAddVisible(false)}>
              <Text style={m.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={m.title}>Add a Club</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView contentContainerStyle={m.container}>
            <Text style={m.sectionLabel}>SELECT CLUB</Text>
            {availableToAdd.length === 0 ? (
              <Text style={{ fontFamily: F.sans, fontSize: 14, color: C.ink3, textAlign: 'center', marginTop: 20 }}>
                All clubs are already in your bag!
              </Text>
            ) : (
              <View style={add.list}>
                {availableToAdd.map((club, i) => (
                  <TouchableOpacity
                    key={club.name}
                    style={[add.row, i < availableToAdd.length - 1 && add.rowBorder]}
                    onPress={() => addClub(club)}
                    activeOpacity={0.7}
                  >
                    <View style={add.iconWrap}>
                      <Ionicons
                        name={(CLUB_ICONS[club.name]?.name || 'golf-outline') as any}
                        size={20}
                        color={CLUB_ICONS[club.name]?.color || C.ink2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={add.clubName}>{club.label}</Text>
                      <Text style={add.clubShort}>{club.name}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={C.fairway} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const ci = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: C.insetBg, gap: 2 },
  label: { fontFamily: F.monoBold, fontSize: 8, letterSpacing: 0.5 },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontFamily: F.sansMedium, fontSize: 14, color: C.fairway },
  container: { padding: 20 },
  subtitle: { fontFamily: F.sans, fontSize: 13, color: C.ink2, textAlign: 'center', marginBottom: 4 },
  progress: { fontFamily: F.mono, fontSize: 11, color: C.ink3, textAlign: 'center', marginBottom: 20 },
  clubList: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  clubRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: C.fairway, borderColor: C.fairway },
  clubIconWrap: {},
  clubInfo: { flex: 1 },
  clubName: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink1 },
  clubMiss: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },
  clubYardage: { alignItems: 'flex-end' },
  yardageRow: { flexDirection: 'row', alignItems: 'center' },
  yardageValue: { fontFamily: F.serifBold, fontSize: 17, color: C.ink1 },
  yardageUnit: { fontFamily: F.mono, fontSize: 11, color: C.ink3 },
  yardageEmpty: { fontFamily: F.sans, fontSize: 12, color: C.ink3, fontStyle: 'italic' },
  deleteBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#FBE8E6' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontFamily: F.sans, fontSize: 14, color: C.ink3, textAlign: 'center' },
})

const m = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.hairline },
  cancel: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink2 },
  title: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1, flex: 1, textAlign: 'center' },
  save: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.fairway },
  container: { padding: 24 },
  sectionLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 12, marginTop: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14 },
  input: { fontFamily: F.serifBold, fontSize: 32, color: C.ink1, flex: 1 },
  inputUnit: { fontFamily: F.mono, fontSize: 13, color: C.ink3 },
  missGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  missBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.border },
  missBtnActive: { backgroundColor: C.fairwayDark, borderColor: C.fairwayDark },
  missBtnText: { fontFamily: F.sansMedium, fontSize: 14, color: C.ink2 },
  missBtnTextActive: { color: C.onDark },
})

const add = StyleSheet.create({
  list: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.insetBg, alignItems: 'center', justifyContent: 'center' },
  clubName: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },
  clubShort: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },
})