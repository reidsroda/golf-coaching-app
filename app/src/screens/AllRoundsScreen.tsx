import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, F } from '../theme'

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
  const par = holes === 9 ? 36 : 72
  const diff = score - par
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

function diffColor(score: number, holes: number) {
  const par = holes === 9 ? 36 : 72
  const diff = score - par
  if (diff <= 0) return C.fairway
  if (diff <= 5) return C.flagYellow
  return C.errorRed
}

export default function AllRoundsScreen({ route, navigation }: any) {
  const [rounds, setRounds] = useState<Round[]>(route.params.rounds as Round[])

  function handleRoundDeleted(id: string) {
    setRounds(prev => prev.filter(r => r.id !== id))
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
            {rounds.map((round, i) => {
              const diff = scoreDiff(round.total_score, round.holes)
              const color = diffColor(round.total_score, round.holes)
              return (
                <TouchableOpacity
                  key={round.id}
                  style={[s.row, i < rounds.length - 1 && s.rowBorder]}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('RoundDetail', {
                    round,
                    onRoundDeleted: handleRoundDeleted,
                  })}
                >
                  <View style={s.rowLeft}>
                    <Text style={s.course}>{round.course_name || 'Unknown course'}</Text>
                    <Text style={s.meta}>{formatDate(round.date)} · {round.holes} holes</Text>
                    <View style={s.stats}>
                      <Text style={s.stat}>{round.total_putts} putts</Text>
                      <Text style={s.statSep}>·</Text>
                      <Text style={s.stat}>{round.fairways_hit} FIR</Text>
                      <Text style={s.statSep}>·</Text>
                      <Text style={s.stat}>{round.gir} GIR</Text>
                    </View>
                  </View>
                  <View style={s.rowRight}>
                    <Text style={[s.score, { color }]}>{diff}</Text>
                    <Text style={s.scoreRaw}>{round.total_score}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={C.ink3} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 17, color: C.ink1 },
  container: { padding: 20 },
  count: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: F.sans, fontSize: 15, color: C.ink3 },
  roundList: {
    backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
    backgroundColor: C.cardBg,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
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
