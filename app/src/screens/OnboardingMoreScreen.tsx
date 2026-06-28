import {
  View, Text, StyleSheet, TouchableOpacity,
  ImageBackground, ScrollView, Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

const UPCOMING = [
  { icon: 'bag-outline' as const,   label: "What's in the bag",       sub: 'Clubs and carry distances' },
  { icon: 'bulb-outline' as const,  label: 'Current swing thoughts',  sub: 'The cues you\'re working with now' },
  { icon: 'golf-outline' as const,  label: 'Common miss',             sub: 'Slice, hook, fat, thin — what creeps in' },
  { icon: 'fitness-outline' as const, label: 'Current drills',        sub: 'What you\'re practicing right now' },
]

export default function OnboardingMoreScreen({ navigation }: any) {
  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Nav */}
        <View style={s.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.ink1} />
          </TouchableOpacity>
          <View style={s.dots}>
            <View style={s.dot} />
            <View style={s.dot} />
            <View style={[s.dot, s.dotActive]} />
            <View style={s.dot} />
          </View>
        </View>

        <Text style={s.eyebrow}>OPTIONAL · THE MORE WE KNOW</Text>
        <Text style={s.title}>Tell us more</Text>
        <Text style={s.titleItalic}>about your game.</Text>
        <Text style={s.subtitle}>
          The more you share, the sharper your insights and personalization become. Every detail makes the app more yours.
        </Text>

        <Text style={s.upNextLabel}>UP NEXT — TAKES ABOUT 2 MINUTES</Text>

        {UPCOMING.map((item, i) => (
          <View key={item.label} style={[s.upRow, i < UPCOMING.length - 1 && s.upRowBorder]}>
            <Ionicons name={item.icon} size={18} color={C.ink3} style={s.upIcon} />
            <View style={s.upText}>
              <Text style={s.upLabel}>{item.label}</Text>
              <Text style={s.upSub}>{item.sub}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.fillBtn}
          onPress={() => navigation.navigate('OnboardingBag')}
          activeOpacity={0.85}
        >
          <Text style={s.fillBtnText}>Let's go →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.skipBtn}
          onPress={async () => {
            if (Platform.OS === 'web') {
              window.location.reload()
            } else {
              await supabase.auth.refreshSession()
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={s.skipBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  container: { padding: 24, paddingTop: 56 },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 20, height: 4, borderRadius: 2, backgroundColor: C.bunker },
  dotActive: { width: 32, backgroundColor: C.fairway },

  eyebrow: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.3, color: C.ink3, marginBottom: 6 },
  title: { fontFamily: F.serifBold, fontSize: 34, color: C.ink1, lineHeight: 40 },
  titleItalic: { fontFamily: F.serifBoldItalic, fontSize: 34, color: C.ink1, lineHeight: 40, marginBottom: 14 },
  subtitle: { fontFamily: F.sans, fontSize: 14, color: C.ink2, lineHeight: 21, marginBottom: 28 },

  upNextLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.3, color: C.ink3, marginBottom: 14 },
  upRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.hairline },
  upRowBorder: {},
  upIcon: { marginTop: 1 },
  upText: { flex: 1 },
  upLabel: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1, marginBottom: 2 },
  upSub: { fontFamily: F.sans, fontSize: 13, color: C.ink2 },

  footer: { padding: 24, paddingBottom: 40, backgroundColor: 'rgba(241,236,224,0.95)', borderTopWidth: 1, borderTopColor: C.hairline, gap: 10 },
  fillBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  fillBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
  skipBtn: { backgroundColor: C.cardBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  skipBtnText: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink1 },
})
