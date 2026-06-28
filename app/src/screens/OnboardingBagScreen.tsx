import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ImageBackground
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

type Club = { name: string; label: string; yardage: string }

export default function OnboardingBagScreen({ navigation }: any) {
  const [clubs, setClubs] = useState<Club[]>(
    ALL_CLUBS.map(c => ({ ...c, yardage: '' }))
  )
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  const removedClubs = ALL_CLUBS.filter(c => !clubs.find(b => b.name === c.name))

  function updateYardage(name: string, text: string) {
    setClubs(prev => prev.map(c => c.name === name ? { ...c, yardage: text } : c))
  }

  function removeClub(name: string) {
    setClubs(prev => prev.filter(c => c.name !== name))
  }

  function addClub(club: { name: string; label: string }) {
    setClubs(prev => {
      const insertIdx = ALL_CLUBS.findIndex(c => c.name === club.name)
      const newList = [...prev]
      // Insert in the original order
      let spliceAt = newList.length
      for (let i = 0; i < newList.length; i++) {
        const existingIdx = ALL_CLUBS.findIndex(c => c.name === newList[i].name)
        if (existingIdx > insertIdx) { spliceAt = i; break }
      }
      newList.splice(spliceAt, 0, { ...club, yardage: '' })
      return newList
    })
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
          yardage: c.yardage ? parseInt(c.yardage) : null,
          common_miss: null,
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
        <TouchableOpacity style={s.addBtn} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={22} color={C.fairwayDark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Your clubs</Text>
        <Text style={s.subtitle}>Type each club's carry distance. Tap the − to remove clubs you don't carry.</Text>
        <Text style={s.progress}>{configured} of {clubs.length} clubs with yardage</Text>

        <View style={s.headerRow}>
          <Text style={s.colLabel}>CLUB</Text>
          <Text style={s.colLabel}>CARRY (YDS)</Text>
        </View>

        <View style={s.clubList}>
          {clubs.map((club, i) => (
            <View
              key={club.name}
              style={[s.clubRow, i < clubs.length - 1 && s.clubRowBorder]}
            >
              <View style={s.clubBadge}>
                <Text style={s.clubBadgeText}>{club.name}</Text>
              </View>
              <Text style={s.clubLabel}>{club.label}</Text>
              <TextInput
                style={[s.yardageInput, club.yardage ? s.yardageInputFilled : null]}
                value={club.yardage}
                onChangeText={t => updateYardage(club.name, t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={C.bunker}
                maxLength={3}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={s.removeBtn}
                onPress={() => removeClub(club.name)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="remove-circle-outline" size={20} color={C.ink3} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {clubs.length === 0 && (
          <Text style={s.emptyHint}>Tap + to add clubs to your bag</Text>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save bag →'}</Text>
        </TouchableOpacity>
      </View>

      {/* Add club modal */}
      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={m.root}>
          <View style={m.header}>
            <Text style={m.title}>Add a club</Text>
            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={m.doneBtn}>
              <Text style={m.done}>Done</Text>
            </TouchableOpacity>
          </View>
          {removedClubs.length === 0 ? (
            <View style={m.empty}>
              <Text style={m.emptyText}>All clubs are already in your bag</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={m.container}>
              <Text style={m.hint}>Tap a club to add it back to your bag</Text>
              <View style={m.clubList}>
                {removedClubs.map((club, i) => (
                  <TouchableOpacity
                    key={club.name}
                    style={[m.clubRow, i < removedClubs.length - 1 && m.clubRowBorder]}
                    onPress={() => { addClub(club); if (removedClubs.length <= 1) setAddModalVisible(false) }}
                    activeOpacity={0.7}
                  >
                    <View style={m.clubBadge}>
                      <Text style={m.clubBadgeText}>{club.name}</Text>
                    </View>
                    <Text style={m.clubLabel}>{club.label}</Text>
                    <Ionicons name="add-circle-outline" size={22} color={C.fairway} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
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
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20 },
  title: { fontFamily: F.serifBold, fontSize: 28, color: C.ink1, marginBottom: 8 },
  subtitle: { fontFamily: F.sans, fontSize: 14, color: C.ink2, lineHeight: 20, marginBottom: 8 },
  progress: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  colLabel: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3 },
  clubList: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  clubRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  clubBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.insetBg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  clubBadgeText: { fontFamily: F.monoBold, fontSize: 11, color: C.ink1 },
  clubLabel: { flex: 1, fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  yardageInput: {
    fontFamily: F.serifBold, fontSize: 18, color: C.ink3,
    width: 52, textAlign: 'right', padding: 0,
    borderBottomWidth: 1.5, borderBottomColor: C.border,
    paddingBottom: 2,
  },
  yardageInputFilled: { color: C.ink1, borderBottomColor: C.fairway },
  removeBtn: { paddingLeft: 6 },
  emptyHint: { fontFamily: F.sans, fontSize: 14, color: C.ink3, textAlign: 'center', marginTop: 32 },
  footer: { padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: C.hairline, backgroundColor: 'rgba(241,236,224,0.95)' },
  saveBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
})

const m = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.hairline },
  title: { fontFamily: F.sansSemiBold, fontSize: 17, color: C.ink1 },
  doneBtn: { paddingHorizontal: 4 },
  done: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.fairway },
  container: { padding: 20 },
  hint: { fontFamily: F.sans, fontSize: 13, color: C.ink3, marginBottom: 16 },
  clubList: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  clubRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  clubBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.insetBg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  clubBadgeText: { fontFamily: F.monoBold, fontSize: 11, color: C.ink1 },
  clubLabel: { flex: 1, fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontFamily: F.sans, fontSize: 15, color: C.ink3, textAlign: 'center' },
})
