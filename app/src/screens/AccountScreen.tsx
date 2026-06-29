import { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, Image, ImageBackground, Modal,
  TextInput, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

import { supabase } from '../lib/supabase'
import { C, F } from '../theme'
import { RankBadge, getRank, RANKS, type Rank } from '../components/RankBadge'

const { width } = Dimensions.get('window')
const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

// Rank system imported from ../components/RankBadge

// ─── WHOOP-style animated handicap bubble ─────────────────────
function HandicapBubble({ handicap }: { handicap: number }) {
  const rotate = useRef(new Animated.Value(0)).current
  const scale1 = useRef(new Animated.Value(1)).current
  const scale2 = useRef(new Animated.Value(0.85)).current
  const opacity1 = useRef(new Animated.Value(0.7)).current
  const opacity2 = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(rotate, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.loop(Animated.sequence([
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
            Animated.timing(opacity1, { toValue: 1, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.0, duration: 2000, useNativeDriver: true }),
            Animated.timing(opacity1, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
          ]),
        ])),
        Animated.loop(Animated.sequence([
          Animated.parallel([
            Animated.timing(scale2, { toValue: 1.12, duration: 3000, useNativeDriver: true }),
            Animated.timing(opacity2, { toValue: 0.7, duration: 3000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale2, { toValue: 0.85, duration: 3000, useNativeDriver: true }),
            Animated.timing(opacity2, { toValue: 0.25, duration: 3000, useNativeDriver: true }),
          ]),
        ])),
      ])
    ).start()
  }, [])

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const SIZE = 90

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow ring 2 */}
      <Animated.View style={[bub.ring, {
        width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        opacity: opacity2, transform: [{ scale: scale2 }],
        borderColor: '#4A9BE8', borderWidth: 1,
        backgroundColor: 'rgba(74,155,232,0.06)',
      }]} />
      {/* Outer glow ring 1 */}
      <Animated.View style={[bub.ring, {
        width: SIZE - 10, height: SIZE - 10, borderRadius: (SIZE - 10) / 2,
        opacity: opacity1, transform: [{ scale: scale1 }],
        borderColor: '#2E7DD4', borderWidth: 1.5,
        backgroundColor: 'rgba(46,125,212,0.1)',
      }]} />
      {/* Rotating particle ring */}
      <Animated.View style={[bub.ring, {
        width: SIZE - 4, height: SIZE - 4, borderRadius: (SIZE - 4) / 2,
        transform: [{ rotate: spin }],
        borderColor: 'rgba(100,180,255,0.3)', borderWidth: 1,
        borderStyle: 'dashed',
      }]} />
      {/* Core sphere */}
      <View style={[bub.core, { width: SIZE - 18, height: SIZE - 18, borderRadius: (SIZE - 18) / 2 }]}>
        {/* Inner gradient simulation with nested views */}
        <View style={bub.coreInner}>
          <Text style={bub.value}>{handicap.toFixed(1)}</Text>
        </View>
        {/* Highlight spot */}
        <View style={bub.highlight} />
      </View>
    </View>
  )
}

const bub = StyleSheet.create({
  ring: { position: 'absolute' },
  core: {
    backgroundColor: '#0A1628',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4A9BE8', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 12, elevation: 10,
    borderWidth: 1, borderColor: 'rgba(100,180,255,0.4)',
  },
  coreInner: { alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: F.serifBold, fontSize: 22, color: '#E8F4FF' },
  highlight: {
    position: 'absolute', top: 6, left: 10,
    width: 18, height: 10, borderRadius: 9,
    backgroundColor: 'rgba(200,230,255,0.15)',
    transform: [{ rotate: '-20deg' }],
  },
})

// ─── Edit Profile Modal ───────────────────────────────────────
function EditProfileModal({ visible, profile, onClose, onSave }: any) {
  const [name, setName] = useState(profile?.full_name || '')
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '')
  const [homeCourse, setHomeCourse] = useState(profile?.home_course || '')

  useEffect(() => {
    if (visible) {
      setName(profile?.full_name || '')
      setAge(profile?.age ? String(profile.age) : '')
      setHomeCourse(profile?.home_course || '')
    }
  }, [visible, profile])

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('users').upsert({
      id: user.id,
      full_name: name.trim(),
      age: age ? parseInt(age) : null,
      home_course: homeCourse.trim(),
    })
    onSave({ full_name: name.trim(), age: age ? parseInt(age) : null, home_course: homeCourse.trim() })
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={ep.root}>
        <View style={ep.header}>
          <TouchableOpacity onPress={onClose}><Text style={ep.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={ep.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}><Text style={ep.save}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={ep.container}>
          <Text style={ep.label}>FULL NAME</Text>
          <TextInput style={ep.input} value={name} onChangeText={setName} placeholder="Reid Sroda" placeholderTextColor={C.ink3} />
          <Text style={ep.label}>AGE</Text>
          <TextInput style={ep.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="24" placeholderTextColor={C.ink3} maxLength={3} />
          <Text style={ep.label}>HOME COURSE</Text>
          <TextInput style={ep.input} value={homeCourse} onChangeText={setHomeCourse} placeholder="Erin Hills" placeholderTextColor={C.ink3} />
        </ScrollView>
      </View>
    </Modal>
  )
}

const ep = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.hairline },
  cancel: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink2 },
  title: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },
  save: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.fairway },
  container: { padding: 24 },
  label: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14, fontFamily: F.sans, fontSize: 15, color: C.ink1 },
})

// ─── Rank Detail Modal ────────────────────────────────────────
function RankModal({ visible, onClose, currentRank, handicap }: any) {
  const currentIdx = RANKS.findIndex(r => r.name === currentRank.name)
  const nextRank = currentIdx > 0 ? RANKS[currentIdx - 1] : null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={rm.root}>
        <View style={rm.header}>
          <TouchableOpacity onPress={onClose} style={{ width: 36 }}><Ionicons name="close" size={22} color={C.ink1} /></TouchableOpacity>
          <Text style={rm.title}>Your Rank</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={rm.container}>
          {/* Motivation */}
          <View style={[rm.motivationCard, { borderLeftColor: currentRank.color }]}>
            <Text style={rm.motivationLabel}>FOCUS AREA — {currentRank.worstStat.toUpperCase()}</Text>
            <Text style={rm.motivationText}>"{currentRank.motivation}"</Text>
          </View>

          {/* Current rank hero */}
          <View style={[rm.currentCard, { borderColor: currentRank.color }]}>
            <View style={[rm.currentBadge, { backgroundColor: currentRank.color }]}>
              <Ionicons name="trophy" size={28} color="#fff" />
            </View>
            <Text style={[rm.currentName, { color: currentRank.color }]}>{currentRank.name}</Text>
            <Text style={rm.currentHdcp}>Handicap {handicap.toFixed(1)}</Text>
            {nextRank && (
              <Text style={rm.nextUp}>Next: {nextRank.name} (reach {nextRank.maxHdcp > 0 ? `+${currentRank.minHdcp}` : 'scratch'})</Text>
            )}
          </View>

          {/* All ranks */}
          <Text style={rm.allTitle}>ALL RANKS</Text>
          {RANKS.map((rank, i) => {
            const isCurrent = rank.name === currentRank.name
            const isPast = i > currentIdx
            return (
              <View key={rank.name} style={[rm.rankRow, isCurrent && rm.rankRowActive]}>
                <RankBadge tier={rank.tier} subTier={rank.subTier} size={80} />
                <View style={rm.rankInfo}>
                  <Text style={[rm.rankName, { color: isPast ? C.ink3 : rank.color }]}>{rank.name}</Text>
                  <Text style={rm.rankRange}>Hdcp {rank.minHdcp === -10 ? 'Below 0' : rank.minHdcp} – {rank.maxHdcp === 99 ? '36+' : rank.maxHdcp}</Text>
                </View>
                {isCurrent && (
                  <View style={[rm.youBadge, { backgroundColor: currentRank.color }]}>
                    <Text style={rm.youBadgeText}>YOU</Text>
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}

const rm = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.hairline },
  title: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink1 },
  container: { padding: 20 },
  motivationCard: { backgroundColor: C.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4, marginBottom: 20 },
  motivationLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 8 },
  motivationText: { fontFamily: F.serifBoldItalic, fontSize: 16, color: C.ink1, lineHeight: 24 },
  currentCard: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 2, padding: 24, alignItems: 'center', gap: 8, marginBottom: 24 },
  currentBadge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  currentName: { fontFamily: F.serifBold, fontSize: 24 },
  currentHdcp: { fontFamily: F.mono, fontSize: 12, color: C.ink2 },
  nextUp: { fontFamily: F.sans, fontSize: 13, color: C.ink3, fontStyle: 'italic', textAlign: 'center' },
  allTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  rankRowActive: { backgroundColor: C.insetBg, borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8 },
  rankDot: { width: 10, height: 10, borderRadius: 5 },
  rankInfo: { flex: 1 },
  rankName: { fontFamily: F.sansSemiBold, fontSize: 14 },
  rankRange: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },
  youBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  youBadgeText: { fontFamily: F.sansBold, fontSize: 10, color: '#fff' },
})

// ─── Handicap Detail Modal ────────────────────────────────────
function HandicapModal({ visible, onClose, handicap, rounds }: any) {
  const hdcpHistory = (rounds || []).slice(0, 10).map((r: any, i: number) => ({
    date: r.date,
    course: r.course_name,
    score: r.total_score,
    diff: r.total_score - 72,
  }))

  // Percentile estimate
  const percentile = Math.round(Math.max(0, Math.min(100, (36 - handicap) / 36 * 100)))

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={hm.root}>
        <View style={hm.header}>
          <TouchableOpacity onPress={onClose} style={{ width: 36 }}><Ionicons name="close" size={22} color={C.ink1} /></TouchableOpacity>
          <Text style={hm.title}>Handicap Index</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={hm.container}>
          {/* Big number */}
          <View style={hm.heroCard}>
            <Text style={hm.heroLabel}>CURRENT HANDICAP INDEX</Text>
            <Text style={hm.heroValue}>{handicap.toFixed(1)}</Text>
            <Text style={hm.heroSub}>Based on best 40% of last 20 rounds</Text>
          </View>

          {/* Stats row */}
          <View style={hm.statsRow}>
            <View style={hm.statCard}>
              <Text style={hm.statValue}>Top {100 - percentile}%</Text>
              <Text style={hm.statLabel}>OF GOLFERS</Text>
            </View>
            <View style={hm.statCard}>
              <Text style={hm.statValue}>{hdcpHistory.length}</Text>
              <Text style={hm.statLabel}>ROUNDS LOGGED</Text>
            </View>
            <View style={hm.statCard}>
              <Text style={hm.statValue}>~{Math.max(0, handicap - 2).toFixed(0)}</Text>
              <Text style={hm.statLabel}>PROJECTED NEXT SEASON</Text>
            </View>
          </View>

          {/* Round differentials */}
          <Text style={hm.listTitle}>RECENT DIFFERENTIALS</Text>
          <View style={hm.roundList}>
            {hdcpHistory.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontFamily: F.sans, fontSize: 14, color: C.ink3 }}>Log rounds to see your differentials</Text>
              </View>
            ) : hdcpHistory.map((r: any, i: number) => (
              <View key={i} style={[hm.roundRow, i < hdcpHistory.length - 1 && hm.roundRowBorder]}>
                <View style={[hm.dot, { backgroundColor: r.diff < 0 ? C.fairway : r.diff < 5 ? C.flagYellow : C.errorRed }]} />
                <View style={{ flex: 1 }}>
                  <Text style={hm.roundCourse}>{r.course || 'Unknown'}</Text>
                  <Text style={hm.roundDate}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <Text style={[hm.roundDiff, { color: r.diff < 0 ? C.fairway : r.diff < 5 ? C.flagYellow : C.errorRed }]}>
                  {r.diff >= 0 ? `+${r.diff}` : r.diff}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const hm = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.hairline },
  title: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink1 },
  container: { padding: 20 },
  heroCard: { backgroundColor: C.fairwayDark, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
  heroLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.5, color: C.onDarkMuted },
  heroValue: { fontFamily: F.serifBold, fontSize: 72, color: C.onDark, lineHeight: 78 },
  heroSub: { fontFamily: F.sans, fontSize: 12, color: C.onDarkMuted },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: F.serifBold, fontSize: 18, color: C.ink1, textAlign: 'center' },
  statLabel: { fontFamily: F.mono, fontSize: 8, color: C.ink3, letterSpacing: 0.5, textAlign: 'center' },
  listTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 12 },
  roundList: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  roundRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  roundRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  dot: { width: 8, height: 8, borderRadius: 4 },
  roundCourse: { fontFamily: F.sansMedium, fontSize: 14, color: C.ink1 },
  roundDate: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },
  roundDiff: { fontFamily: F.serifBold, fontSize: 20 },
})

// ─── Main AccountScreen ───────────────────────────────────────
export default function AccountScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [rounds, setRounds] = useState<any[]>([])
  const [handicap, setHandicap] = useState<number>(18)
  const [memberSince, setMemberSince] = useState<string>('')
  const [showEdit, setShowEdit] = useState(false)
  const [showRank, setShowRank] = useState(false)
  const [showHandicap, setShowHandicap] = useState(false)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    setUser(u)
    setMemberSince(new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))

    const { data: prof } = await supabase.from('users').select('*').eq('id', u.id).single()
    if (prof) setProfile(prof)

    const { data: r } = await supabase
      .from('rounds')
      .select('total_score, holes, date, course_name')
      .eq('user_id', u.id)
      .order('date', { ascending: false })
      .limit(20)

    if (r) {
      setRounds(r)
      const r18 = r.filter((rnd: any) => rnd.holes === 18)
      if (r18.length >= 3) {
        const diffs = r18.map((rnd: any) => rnd.total_score - 72)
        const best = [...diffs].sort((a, b) => a - b).slice(0, Math.ceil(r18.length * 0.4))
        const hdcp = best.reduce((a: number, b: number) => a + b, 0) / best.length
        setHandicap(Math.max(0, hdcp))
      }
    }
  }

  async function pickPhoto() {
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync()
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to take a photo.')
            return
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
          })
          if (!result.canceled) uploadPhoto(result.assets[0].uri)
        }
      },
      {
        text: 'Choose from Library', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Photo library permission is required.')
            return
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
          })
          if (!result.canceled) uploadPhoto(result.assets[0].uri)
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ])
  }

  async function uploadPhoto(uri: string) {
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return

      const ext = uri.split('.').pop() || 'jpg'
      const fileName = `${u.id}/avatar.${ext}`

      const response = await fetch(uri)
      const blob = await response.blob()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` })

      if (uploadError) {
        // If storage bucket doesn't exist, just use local URI
        setProfile((p: any) => ({ ...p, avatar_url: uri }))
        await supabase.from('users').upsert({ id: u.id, avatar_url: uri })
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setProfile((p: any) => ({ ...p, avatar_url: publicUrl }))
      await supabase.from('users').upsert({ id: u.id, avatar_url: publicUrl })
    } catch (e) {
      Alert.alert('Upload failed', 'Could not save photo. Please try again.')
    }
  }

  const rank = getRank(handicap)
  const displayName = profile?.full_name || 'Set your name'
  const initials = (profile?.full_name || 'G')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const homeCourse = profile?.home_course || 'No home course set'
  const age = profile?.age

  const menuItems = [
    { icon: 'bag-outline' as const,  label: 'My Bag',          sub: 'Manage your clubs & distances',  onPress: () => navigation.navigate('MyBag') },
    { icon: 'bulb-outline' as const, label: 'My Swing Thoughts', sub: 'Notes, goals & training log', onPress: () => navigation.navigate('SwingThoughts') },
  ]

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.topBar}>
          <Text style={s.eyebrow}>ME</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={s.gearBtn}>
            <Ionicons name="settings-outline" size={22} color={C.ink2} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.profileTop}>
            <TouchableOpacity style={s.avatar} onPress={pickPhoto}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={s.avatarEditBadge}>
                <Ionicons name="camera" size={10} color={C.onDark} />
              </View>
            </TouchableOpacity>

            <View style={s.profileInfo}>
              <Text style={s.profileName}>{displayName}</Text>
              <Text style={s.profileMeta}>
                {[age && `Age ${age}`, homeCourse].filter(Boolean).join(' · ')}
              </Text>
            </View>

            <TouchableOpacity style={s.editBtn} onPress={() => setShowEdit(true)}>
              <Ionicons name="pencil-outline" size={13} color={C.ink2} />
              <Text style={s.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={s.memberRow}>
            <View style={s.memberIcon}>
              <Ionicons name="golf-outline" size={14} color={C.fairway} />
            </View>
            <Text style={s.memberText}>Member since</Text>
            <Text style={s.memberDate}>{memberSince}</Text>
          </View>
        </View>

        {/* Metric cards */}
        <View style={s.metricRow}>
          {/* Rank — clickable */}
          <TouchableOpacity style={[s.metricCard, { borderTopColor: rank.color, borderTopWidth: 3 }]} onPress={() => setShowRank(true)} activeOpacity={0.8}>
            <RankBadge tier={rank.tier} subTier={rank.subTier} size={180} />
            <Text style={[s.rankName, { color: rank.color }]}>{rank.name}</Text>
            <Text style={s.metricCardLabel}>YOUR RANK</Text>
            <Text style={s.rankSub}>Tap to explore</Text>
          </TouchableOpacity>

          {/* Handicap — clickable */}
          <TouchableOpacity style={s.metricCard} onPress={() => setShowHandicap(true)} activeOpacity={0.8}>
            <HandicapBubble handicap={handicap} />
            <Text style={s.metricCardLabel}>HANDICAP INDEX</Text>
            <Text style={s.rankSub}>Tap for details</Text>
          </TouchableOpacity>
        </View>

        {/* Menu items */}
        <View style={s.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuItem, i < menuItems.length - 1 && s.menuItemBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={s.menuIconWrap}>
                <Ionicons name={item.icon} size={20} color={C.fairway} />
              </View>
              <View style={s.menuText}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.ink3} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={showEdit}
        profile={profile}
        onClose={() => setShowEdit(false)}
        onSave={(updated: any) => setProfile((p: any) => ({ ...p, ...updated }))}
      />
      <RankModal
        visible={showRank}
        onClose={() => setShowRank(false)}
        currentRank={rank}
        handicap={handicap}
      />
      <HandicapModal
        visible={showHandicap}
        onClose={() => setShowHandicap(false)}
        handicap={handicap}
        rounds={rounds}
      />
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  container: { padding: 20, paddingTop: 64 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3 },
  gearBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  profileCard: { backgroundColor: C.cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { position: 'relative' },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.fairway, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: F.serifBold, fontSize: 26, color: C.onDark },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: C.ink1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.cardBg },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: F.serifBold, fontSize: 22, color: C.ink1, marginBottom: 4 },
  profileMeta: { fontFamily: F.sans, fontSize: 13, color: C.ink2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.insetBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.border },
  editBtnText: { fontFamily: F.sansMedium, fontSize: 12, color: C.ink2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.insetBg, borderRadius: 10, padding: 12 },
  memberIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.pageBg, alignItems: 'center', justifyContent: 'center' },
  memberText: { fontFamily: F.sans, fontSize: 13, color: C.ink2 },
  memberDate: { fontFamily: F.sansSemiBold, fontSize: 13, color: C.ink1 },

  metricRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 8 },
  rankBadge: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  rankName: { fontFamily: F.serifBold, fontSize: 15, textAlign: 'center' },
  metricCardLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, textAlign: 'center' },
  rankSub: { fontFamily: F.mono, fontSize: 10, color: C.ink3, textAlign: 'center' },

  menuCard: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  menuIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.insetBg, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },
  menuSub: { fontFamily: F.sans, fontSize: 12, color: C.ink2, marginTop: 2 },
})