import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, F } from '../theme'

const PAR = 72

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

export default function AllRoundsScreen({ route, navigation }: any) {
  const { rounds } = route.params as { rounds: Round[] }

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

        <View style={s.roundList}>
          {rounds.map((round, i) => {
            const diff = scoreDiff(round.total_score, round.holes)
            const color = diffColor(round.total_score, round.holes)
            return (
              <View
                key={round.id}
                style={[s.roundRow, i < rounds.length - 1 && s.roundRowBorder]}
              >
                <View style={s.roundLeft}>
                  <Text style={s.roundCourse}>{round.course_name || 'Unknown course'}</Text>
                  <Text style={s.roundDate}>{formatDate(round.date)} · {round.holes} holes</Text>
                  <View style={s.roundStats}>
                    <Text style={s.roundStat}>{round.total_putts} putts</Text>
                    <Text style={s.roundStatSep}>·</Text>
                    <Text style={s.roundStat}>{round.fairways_hit} FIR</Text>
                    <Text style={s.roundStatSep}>·</Text>
                    <Text style={s.roundStat}>{round.gir} GIR</Text>
                  </View>
                </View>
                <View style={s.roundRight}>
                  <Text style={[s.roundScore, { color }]}>{diff}</Text>
                  <Text style={s.roundScoreRaw}>{round.total_score}</Text>
                </View>
              </View>
            )
          })}
        </View>

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
  roundRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  roundRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  roundLeft: { flex: 1 },
  roundCourse: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1, marginBottom: 3 },
  roundDate: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginBottom: 6 },
  roundStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roundStat: { fontFamily: F.sans, fontSize: 12, color: C.ink2 },
  roundStatSep: { fontFamily: F.sans, fontSize: 12, color: C.ink3 },
  roundRight: { alignItems: 'flex-end' },
  roundScore: { fontFamily: F.serifBold, fontSize: 26, lineHeight: 30 },
  roundScoreRaw: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },
})
