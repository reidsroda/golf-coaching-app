import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, PanResponder
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const PAR = 72
const DELETE_W = 80

type Round = {
  id: string
  total_score: number
  total_putts: number
  fairways_hit: number
  gir: number
  penalties: number
  holes: number
  date: string
  course_name: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function scoreDiff(score: number, holes: number) {
  const par = holes === 9 ? 36 : PAR
  const diff = score - par
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

function diffColor(score: number, holes: number) {
  const par = holes === 9 ? 36 : PAR
  const diff = score - par
  if (diff <= 0) return C.fairway
  if (diff <= 5) return C.flagYellow
  return C.errorRed
}

// ─── Swipeable row ──────────────────────────────────────────
function SwipeableRoundRow({
  round,
  isLast,
  onDelete,
  onPress,
}: {
  round: Round
  isLast: boolean
  onDelete: () => void
  onPress: () => void
}) {
  const translateX = useRef(new Animated.Value(0)).current
  const isOpen = useRef(false)
  const isAnimating = useRef(false)

  function snapTo(toValue: number, cb?: () => void) {
    isAnimating.current = true
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      isAnimating.current = false
      cb?.()
    })
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation()
      },
      onPanResponderMove: (_, gs) => {
        const base = isOpen.current ? -DELETE_W : 0
        const next = Math.max(-DELETE_W, Math.min(0, base + gs.dx))
        translateX.setValue(next)
      },
      onPanResponderRelease: (_, gs) => {
        const base = isOpen.current ? -DELETE_W : 0
        const result = base + gs.dx
        if (result < -DELETE_W / 2) {
          snapTo(-DELETE_W)
          isOpen.current = true
        } else {
          snapTo(0)
          isOpen.current = false
        }
      },
    })
  ).current

  function handleDeletePress() {
    // Close the swipe before showing alert
    snapTo(0, () => {
      isOpen.current = false
      Alert.alert(
        'Delete this round?',
        'This round will be permanently removed from your account and cannot be recovered.',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: onDelete,
          },
        ]
      )
    })
  }

  const diff = scoreDiff(round.total_score, round.holes)
  const color = diffColor(round.total_score, round.holes)

  return (
    <View style={[sw.wrapper, !isLast && sw.wrapperBorder]}>
      {/* Delete action underneath */}
      <View style={sw.deleteAction}>
        <TouchableOpacity style={sw.deleteTouchable} onPress={handleDeletePress} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={sw.deleteLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Row content — slides left */}
      <Animated.View
        style={[sw.rowContent, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={sw.rowInner}
          onPress={onPress}
          activeOpacity={0.75}
        >
          <View style={sw.rowLeft}>
            <Text style={sw.course}>{round.course_name || 'Unknown course'}</Text>
            <Text style={sw.meta}>{formatDate(round.date)} · {round.holes} holes</Text>
            <View style={sw.stats}>
              <Text style={sw.stat}>{round.total_putts} putts</Text>
              <Text style={sw.statSep}>·</Text>
              <Text style={sw.stat}>{round.fairways_hit} FIR</Text>
              <Text style={sw.statSep}>·</Text>
              <Text style={sw.stat}>{round.gir} GIR</Text>
            </View>
          </View>
          <View style={sw.rowRight}>
            <Text style={[sw.score, { color }]}>{diff}</Text>
            <Text style={sw.scoreRaw}>{round.total_score}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.ink3} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const sw = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden' },
  wrapperBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  deleteAction: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: DELETE_W, backgroundColor: C.errorRed,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteTouchable: {
    flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  deleteLabel: { fontFamily: F.sansSemiBold, fontSize: 11, color: '#fff', letterSpacing: 0.5 },
  rowContent: { backgroundColor: C.cardBg },
  rowInner: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  rowLeft: { flex: 1 },
  course: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1, marginBottom: 3 },
  meta: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginBottom: 6 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stat: { fontFamily: F.sans, fontSize: 12, color: C.ink2 },
  statSep: { fontFamily: F.sans, fontSize: 12, color: C.ink3 },
  rowRight: { alignItems: 'flex-end' },
  score: { fontFamily: F.serifBold, fontSize: 26, lineHeight: 30 },
  scoreRaw: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },
})

// ─── Screen ─────────────────────────────────────────────────
export default function AllRoundsScreen({ route, navigation }: any) {
  const [rounds, setRounds] = useState<Round[]>(route.params.rounds as Round[])

  async function deleteRound(id: string) {
    setRounds(prev => prev.filter(r => r.id !== id))
    try {
      await supabase.from('rounds').delete().eq('id', id)
    } catch (e) {
      console.log('Delete error:', e)
    }
  }

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>All rounds</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.count}>{rounds.length} {rounds.length === 1 ? 'round' : 'rounds'}</Text>

        {rounds.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No rounds logged yet</Text>
          </View>
        )}

        {rounds.length > 0 && (
          <View style={s.roundList}>
            {rounds.map((round, i) => (
              <SwipeableRoundRow
                key={round.id}
                round={round}
                isLast={i === rounds.length - 1}
                onDelete={() => deleteRound(round.id)}
                onPress={() => navigation.navigate('RoundDetail', { round })}
              />
            ))}
          </View>
        )}

        <Text style={s.swipeHint}>Swipe left on a round to delete</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 17, color: C.ink1 },
  container: { padding: 20 },
  count: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: F.sans, fontSize: 15, color: C.ink3 },
  roundList: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  swipeHint: { fontFamily: F.mono, fontSize: 10, letterSpacing: 0.8, color: C.ink3, textAlign: 'center', marginTop: 16 },
})
