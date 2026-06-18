import {
  View, Text, StyleSheet, TouchableOpacity,
  ImageBackground, ScrollView, Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

const ITEMS = [
  {
    key: 'bag',
    icon: 'bag-outline' as const,
    color: '#5A8C6A',
    label: "What's in the bag",
    sub: 'Your clubs and the yardage you carry each',
    screen: 'OnboardingBag',
  },
  {
    key: 'swingThoughts',
    icon: 'bulb-outline' as const,
    color: '#C9A23E',
    label: 'Current swing thoughts',
    sub: "The cues you're playing with right now",
    screen: 'OnboardingSwingThoughts',
  },
  {
    key: 'miss',
    icon: 'golf-outline' as const,
    color: '#B14B3A',
    label: 'Common miss',
    sub: 'Slice, hook, thin, fat — what creeps in',
    screen: 'OnboardingCommonMiss',
  },
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

        {/* Items */}
        <View style={s.itemList}>
          {ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={[s.itemRow, i < ITEMS.length - 1 && s.itemRowBorder]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.75}
            >
              <View style={[s.iconWrap, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={s.itemText}>
                <Text style={s.itemLabel}>{item.label}</Text>
                <Text style={s.itemSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.ink3} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.fillBtn}
          onPress={() => navigation.navigate('OnboardingBag')}
          activeOpacity={0.85}
        >
          <Text style={s.fillBtnText}>Fill it out now →</Text>
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
        <Text style={s.footerHint}>TAKES ABOUT 2 MINUTES · ADD MORE ANYTIME</Text>
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

  itemList: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1 },
  itemLabel: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1, marginBottom: 2 },
  itemSub: { fontFamily: F.sans, fontSize: 12, color: C.ink2 },

  footer: { padding: 24, paddingBottom: 40, backgroundColor: 'rgba(241,236,224,0.95)', borderTopWidth: 1, borderTopColor: C.hairline, gap: 10 },
  fillBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  fillBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
  skipBtn: { backgroundColor: C.cardBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  skipBtnText: { fontFamily: F.sansMedium, fontSize: 15, color: C.ink1 },
  footerHint: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.ink3, textAlign: 'center' },
})