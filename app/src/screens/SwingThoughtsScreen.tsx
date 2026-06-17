import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const { width } = Dimensions.get('window')

type ThoughtCategory = 'swing_thought' | 'problem' | 'goal' | 'training'

type Thought = {
  id: string
  category: ThoughtCategory
  content: string
  created_at: string
  pinned: boolean
}

const CATEGORIES: { key: ThoughtCategory; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'swing_thought', label: 'Swing Thought', icon: 'flash-outline',    color: C.flagYellow, desc: 'Key feels & cues to remember' },
  { key: 'problem',       label: 'Problem',       icon: 'warning-outline',  color: C.errorRed,   desc: 'Issues to work on' },
  { key: 'goal',          label: 'Goal',          icon: 'trophy-outline',   color: C.fairway,    desc: 'Targets & milestones' },
  { key: 'training',      label: 'Training',      icon: 'fitness-outline',  color: C.teeBlue,    desc: 'Range sessions & drills' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SwingThoughtsScreen({ navigation }: any) {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [activeTab, setActiveTab] = useState<ThoughtCategory | 'all'>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [newCategory, setNewCategory] = useState<ThoughtCategory>('swing_thought')
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadThoughts() }, [])

  async function loadThoughts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('swing_thoughts')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setThoughts(data || [])
    setLoading(false)
  }

  async function addThought() {
    if (!newContent.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('swing_thoughts').insert({
      user_id: user.id, category: newCategory,
      content: newContent.trim(), pinned: false,
    }).select().single()
    if (data) setThoughts(prev => [data, ...prev])
    setNewContent('')
    setModalVisible(false)
  }

  async function togglePin(thought: Thought) {
    await supabase.from('swing_thoughts').update({ pinned: !thought.pinned }).eq('id', thought.id)
    setThoughts(prev => prev.map(t => t.id === thought.id ? { ...t, pinned: !t.pinned } : t)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)))
  }

  async function deleteThought(id: string) {
    Alert.alert('Delete', 'Remove this thought?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('swing_thoughts').delete().eq('id', id)
          setThoughts(prev => prev.filter(t => t.id !== id))
        }
      }
    ])
  }

  const filtered = activeTab === 'all' ? thoughts : thoughts.filter(t => t.category === activeTab)
  const pinned = filtered.filter(t => t.pinned)
  const unpinned = filtered.filter(t => !t.pinned)

  function ThoughtCard({ thought }: { thought: Thought }) {
    const cat = CATEGORIES.find(c => c.key === thought.category)!
    return (
      <View style={tc.card}>
        <View style={tc.top}>
          <View style={[tc.catBadge, { backgroundColor: cat.color + '22' }]}>
            <Ionicons name={cat.icon as any} size={12} color={cat.color} />
            <Text style={[tc.catLabel, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <View style={tc.actions}>
            <TouchableOpacity onPress={() => togglePin(thought)} style={tc.actionBtn}>
              <Ionicons name={thought.pinned ? 'pin' : 'pin-outline'} size={15} color={thought.pinned ? C.flagYellow : C.ink3} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteThought(thought.id)} style={tc.actionBtn}>
              <Ionicons name="trash-outline" size={15} color={C.ink3} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={tc.content}>{thought.content}</Text>
        <Text style={tc.time}>{timeAgo(thought.created_at)}</Text>
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
        <Text style={s.topTitle}>Swing Thoughts</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color={C.fairway} />
        </TouchableOpacity>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'all' && s.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[s.tabText, activeTab === 'all' && s.tabTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.tab, activeTab === cat.key && s.tabActive, activeTab === cat.key && { borderColor: cat.color }]}
            onPress={() => setActiveTab(cat.key)}
          >
            <Ionicons name={cat.icon as any} size={13} color={activeTab === cat.key ? cat.color : C.ink3} />
            <Text style={[s.tabText, activeTab === cat.key && s.tabTextActive, activeTab === cat.key && { color: cat.color }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Summary cards */}
        <View style={s.summaryRow}>
          {CATEGORIES.map(cat => {
            const count = thoughts.filter(t => t.category === cat.key).length
            return (
              <TouchableOpacity key={cat.key} style={s.summaryCard} onPress={() => setActiveTab(cat.key)}>
                <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                <Text style={[s.summaryCount, { color: cat.color }]}>{count}</Text>
                <Text style={s.summaryLabel}>{cat.label.split(' ')[0]}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="bulb-outline" size={40} color={C.ink3} />
            <Text style={s.emptyTitle}>No thoughts yet</Text>
            <Text style={s.emptySub}>Tap + to add your first {activeTab === 'all' ? 'thought' : activeTab.replace('_', ' ')}</Text>
          </View>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <Text style={s.sectionLabel}>📌 PINNED</Text>
                {pinned.map(t => <ThoughtCard key={t.id} thought={t} />)}
              </>
            )}
            {unpinned.length > 0 && (
              <>
                {pinned.length > 0 && <Text style={s.sectionLabel}>RECENT</Text>}
                {unpinned.map(t => <ThoughtCard key={t.id} thought={t} />)}
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add thought modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={am.root}>
          <View style={am.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={am.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={am.title}>New Thought</Text>
            <TouchableOpacity onPress={addThought}>
              <Text style={am.save}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={am.container}>
            <Text style={am.label}>CATEGORY</Text>
            <View style={am.catGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[am.catBtn, newCategory === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
                  onPress={() => setNewCategory(cat.key)}
                >
                  <Ionicons name={cat.icon as any} size={18} color={newCategory === cat.key ? cat.color : C.ink3} />
                  <Text style={[am.catBtnTitle, newCategory === cat.key && { color: cat.color }]}>{cat.label}</Text>
                  <Text style={am.catBtnDesc}>{cat.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={am.label}>YOUR THOUGHT</Text>
            <TextInput
              style={am.input}
              multiline
              numberOfLines={5}
              placeholder="Write your thought here…"
              placeholderTextColor={C.ink3}
              value={newContent}
              onChangeText={setNewContent}
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const tc = StyleSheet.create({
  card: { backgroundColor: C.cardBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catLabel: { fontFamily: F.sansMedium, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  content: { fontFamily: F.sans, fontSize: 14, color: C.ink1, lineHeight: 21 },
  time: { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 8 },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink1 },
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  tabScroll: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  tabRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.border },
  tabActive: { borderColor: C.fairway },
  tabText: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink3 },
  tabTextActive: { color: C.fairway },

  container: { padding: 16 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 4 },
  summaryCount: { fontFamily: F.serifBold, fontSize: 22 },
  summaryLabel: { fontFamily: F.mono, fontSize: 9, color: C.ink3, letterSpacing: 0.5 },

  sectionLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 10, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: F.serifBold, fontSize: 20, color: C.ink1 },
  emptySub: { fontFamily: F.sans, fontSize: 14, color: C.ink2 },
})

const am = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.hairline },
  cancel: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink2 },
  title: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },
  save: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.fairway },
  container: { padding: 20 },
  label: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 12, marginTop: 20 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  catBtn: { width: (width - 60) / 2, backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, padding: 14, gap: 6 },
  catBtnTitle: { fontFamily: F.sansSemiBold, fontSize: 14, color: C.ink1 },
  catBtnDesc: { fontFamily: F.sans, fontSize: 11, color: C.ink3 },
  input: { backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, fontFamily: F.sans, fontSize: 15, color: C.ink1, minHeight: 140, lineHeight: 22 },
})