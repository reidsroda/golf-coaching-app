import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ImageBackground
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

const TAGS = ['Driving', 'Irons', 'Wedges', 'Putting']

type Thought = { text: string; tag: string }

export default function OnboardingSwingThoughtsScreen({ navigation }: any) {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [inputText, setInputText] = useState('')
  const [selectedTag, setSelectedTag] = useState('Driving')
  const [addingNew, setAddingNew] = useState(false)
  const [saving, setSaving] = useState(false)

  function addThought() {
    if (!inputText.trim()) return
    setThoughts(prev => [...prev, { text: inputText.trim(), tag: selectedTag }])
    setInputText('')
    setAddingNew(false)
  }

  function removeThought(idx: number) {
    setThoughts(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && thoughts.length > 0) {
        await supabase.from('swing_thoughts').insert(
          thoughts.map(t => ({
            user_id: user.id,
            category: 'swing_thought',
            content: `[${t.tag}] ${t.text}`,
            pinned: false,
          }))
        )
      }
    } catch (e) {
      console.log('Save error:', e)
    }
    setSaving(false)
    navigation.navigate('OnboardingCommonMiss')
  }

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Swing thoughts</Text>
        <Text style={s.stepLabel}>2 / 4</Text>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.eyebrow}>SWING THOUGHTS</Text>
        <Text style={s.title}>What are you{'\n'}<Text style={s.titleItalic}>thinking about?</Text></Text>
        <Text style={s.subtitle}>Keep the cues that are working right now. We'll surface them before each round and track what sticks.</Text>

        {/* Inline add input */}
        <View style={s.addRow}>
          <TextInput
            style={s.addInput}
            placeholder="Add a swing thought..."
            placeholderTextColor={C.ink3}
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setAddingNew(true)}
            returnKeyType="done"
            onSubmitEditing={addThought}
          />
          <TouchableOpacity style={s.addBtn} onPress={addThought} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={C.onDark} />
          </TouchableOpacity>
        </View>

        {/* Tag selector when adding */}
        {addingNew && (
          <View style={s.tagRow}>
            <Text style={s.tagLabel}>TAG IT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tags}>
              {TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[s.tag, selectedTag === tag && s.tagActive]}
                  onPress={() => setSelectedTag(tag)}
                >
                  {selectedTag === tag && <View style={s.tagDot} />}
                  <Text style={[s.tagText, selectedTag === tag && s.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.tagHint}>Tag it so it shows up with the right part of your game.</Text>
          </View>
        )}

        {/* Thought cards */}
        {thoughts.map((thought, i) => (
          <View key={i} style={s.thoughtCard}>
            <Ionicons name="chatbubble-outline" size={16} color={C.ink3} style={s.quoteIcon} />
            <Text style={s.thoughtText}>{thought.text}</Text>
            <View style={s.thoughtBottom}>
              <View style={[s.thoughtTag, { backgroundColor: C.insetBg }]}>
                <Text style={s.thoughtTagText}>{thought.tag.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => removeThought(i)}>
                <Ionicons name="close" size={16} color={C.ink3} />
              </TouchableOpacity>
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
  subtitle: { fontFamily: F.sans, fontSize: 14, color: C.ink2, lineHeight: 20, marginBottom: 20 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 12 },
  addInput: { flex: 1, fontFamily: F.sans, fontSize: 15, color: C.ink1, paddingVertical: 12 },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.fairwayDark, alignItems: 'center', justifyContent: 'center' },
  tagRow: { backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16 },
  tagLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.ink3, marginBottom: 10 },
  tags: { gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.pageBg },
  tagActive: { borderColor: C.fairway, backgroundColor: C.fairway },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.onDark },
  tagText: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink2 },
  tagTextActive: { color: C.onDark },
  tagHint: { fontFamily: F.sans, fontSize: 11, color: C.ink3, fontStyle: 'italic', marginTop: 10 },
  thoughtCard: { backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  quoteIcon: { marginBottom: 6 },
  thoughtText: { fontFamily: F.serifBoldItalic, fontSize: 15, color: C.ink1, lineHeight: 22, marginBottom: 10 },
  thoughtBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thoughtTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  thoughtTagText: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.5, color: C.ink2 },
  footer: { padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: C.hairline, backgroundColor: 'rgba(241,236,224,0.95)' },
  saveBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
})