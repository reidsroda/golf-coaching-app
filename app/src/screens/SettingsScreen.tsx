import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

type SettingItem = {
  label: string
  sub?: string
  type: 'arrow' | 'toggle' | 'value' | 'info'
  value?: string | boolean
  onPress?: () => void
  onToggle?: (v: boolean) => void
}

type SettingSection = {
  title: string
  items: SettingItem[]
}

export default function SettingsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState(true)
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial')
  const [handedness, setHandedness] = useState<'right' | 'left'>('right')

  async function handleLogOut() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut()
        }
      }
    ])
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: () => {
            Alert.alert('Contact Support', 'Please contact support@tapingolfapp.com to delete your account.')
          }
        }
      ]
    )
  }

  const sections: SettingSection[] = [
    {
      title: 'General',
      items: [
        {
          label: 'Distance Units',
          type: 'value',
          value: units === 'imperial' ? 'Imperial (yds)' : 'Metric (m)',
          onPress: () => setUnits(u => u === 'imperial' ? 'metric' : 'imperial'),
        },
        {
          label: 'Handedness',
          type: 'value',
          value: handedness === 'right' ? 'Right Handed' : 'Left Handed',
          onPress: () => setHandedness(h => h === 'right' ? 'left' : 'right'),
        },
        {
          label: 'Notifications',
          type: 'toggle',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          label: 'Language',
          sub: 'English',
          type: 'arrow',
          onPress: () => Alert.alert('Coming soon', 'Additional languages coming soon.'),
        },
      ],
    },
    {
      title: 'Account Security',
      items: [
        { label: 'Email',          type: 'arrow', onPress: () => navigation.navigate('EditProfile') },
        { label: 'Mobile Number',  type: 'arrow', onPress: () => Alert.alert('Coming soon') },
        { label: 'Manage Friends', type: 'arrow', onPress: () => Alert.alert('Coming soon') },
      ],
    },
    {
      title: 'About Us',
      items: [
        { label: 'Terms of Service', type: 'arrow', onPress: () => Alert.alert('Terms of Service', 'Coming soon.') },
        { label: 'Privacy Policy',   type: 'arrow', onPress: () => Alert.alert('Privacy Policy', 'Coming soon.') },
        { label: 'Software License', type: 'arrow', onPress: () => Alert.alert('Software License', 'Coming soon.') },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help & Feedback',      type: 'arrow', onPress: () => Alert.alert('Help', 'Email support@tapingolfapp.com') },
        { label: 'Rate Tap In',          type: 'arrow', onPress: () => Alert.alert('Coming soon', 'App Store rating coming soon.') },
        { label: 'Manage Subscription',  type: 'arrow', onPress: () => Alert.alert('Coming soon') },
        { label: 'Version',              type: 'info',  value: '1.0.0 (Build 1)' },
      ],
    },
  ]

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink1} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {sections.map((section, si) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={s.sectionCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.item, ii < section.items.length - 1 && s.itemBorder]}
                  onPress={item.onPress}
                  disabled={item.type === 'toggle' || item.type === 'info'}
                  activeOpacity={item.type === 'arrow' || item.type === 'value' ? 0.7 : 1}
                >
                  <View style={s.itemLeft}>
                    <Text style={s.itemLabel}>{item.label}</Text>
                    {item.sub && <Text style={s.itemSub}>{item.sub}</Text>}
                  </View>

                  {item.type === 'toggle' && (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onToggle}
                      trackColor={{ false: C.bunker, true: C.fairway }}
                      thumbColor={C.onDark}
                    />
                  )}
                  {item.type === 'value' && (
                    <View style={s.valueWrap}>
                      <Text style={s.valueText}>{item.value as string}</Text>
                      <Ionicons name="chevron-forward" size={14} color={C.ink3} />
                    </View>
                  )}
                  {item.type === 'arrow' && (
                    <Ionicons name="chevron-forward" size={16} color={C.ink3} />
                  )}
                  {item.type === 'info' && (
                    <Text style={s.infoText}>{item.value as string}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Log out */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogOut}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={s.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.ink1 },

  container: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 8, paddingLeft: 4 },
  sectionCard: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  itemLeft: { flex: 1 },
  itemLabel: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink1 },
  itemSub: { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginTop: 2 },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valueText: { fontFamily: F.sans, fontSize: 14, color: C.ink2 },
  infoText: { fontFamily: F.mono, fontSize: 12, color: C.ink3 },

  logoutBtn: { backgroundColor: C.teeBlue, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  logoutText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
  deleteBtn: { backgroundColor: C.cardBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: C.errorRed },
  deleteText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.errorRed },
})