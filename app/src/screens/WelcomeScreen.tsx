import {
  View, Text, StyleSheet, TouchableOpacity,
  ImageBackground, Dimensions, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, F } from '../theme'

const { width, height } = Dimensions.get('window')
const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

export default function WelcomeScreen({ navigation }: any) {
  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <View style={s.container}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Ionicons name="golf" size={22} color={C.fairway} />
          </View>
        </View>

        {/* Progress dots */}
        <View style={s.dots}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>

        {/* Headline */}
        <View style={s.headlineWrap}>
          <Text style={s.eyebrow}>CREATE ACCOUNT</Text>
          <Text style={s.title}>Welcome to</Text>
          <Text style={s.titleItalic}>Tap in.</Text>
          <Text style={s.subtitle}>
            Hold onto your good swing thoughts. Stay consistent with the habits that work.
          </Text>
        </View>

        {/* Auth options */}
        <View style={s.authWrap}>
          {/* Google */}
          <TouchableOpacity
            style={s.googleBtn}
            onPress={() => Alert.alert('Coming soon', 'Google sign-in coming soon.')}
            activeOpacity={0.85}
          >
            <Text style={s.googleIcon}>G</Text>
            <Text style={s.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple */}
          <TouchableOpacity
            style={s.appleBtn}
            onPress={() => Alert.alert('Coming soon', 'Apple sign-in coming soon.')}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-apple" size={18} color={C.onDark} />
            <Text style={s.appleBtnText}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* OR divider */}
          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>OR</Text>
            <View style={s.orLine} />
          </View>

          {/* Create account */}
          <TouchableOpacity
            style={s.createBtn}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.85}
          >
            <Text style={s.createBtnText}>Create account →</Text>
          </TouchableOpacity>

          {/* Sign in link */}
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={s.signInText}>
              Already have an account?{' '}
              <Text style={s.signInLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  container: { flex: 1, padding: 24, paddingTop: 60 },

  logoWrap: { marginBottom: 24 },
  logoCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  dots: { flexDirection: 'row', gap: 6, marginBottom: 32 },
  dot: { width: 20, height: 4, borderRadius: 2, backgroundColor: C.bunker },
  dotActive: { width: 32, backgroundColor: C.fairway },

  headlineWrap: { flex: 1 },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3, marginBottom: 8 },
  title: { fontFamily: F.serifBold, fontSize: 40, color: C.ink1, lineHeight: 46 },
  titleItalic: { fontFamily: F.serifBoldItalic, fontSize: 40, color: C.ink1, lineHeight: 46, marginBottom: 16 },
  subtitle: { fontFamily: F.sans, fontSize: 15, color: C.ink2, lineHeight: 22, maxWidth: 300 },

  authWrap: { gap: 12, paddingBottom: 40 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.cardBg, borderRadius: 12, paddingVertical: 16,
    borderWidth: 1, borderColor: C.border,
  },
  googleIcon: { fontFamily: F.sansBold, fontSize: 16, color: '#4285F4' },
  googleBtnText: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.ink1 },

  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.ink1, borderRadius: 12, paddingVertical: 16,
  },
  appleBtnText: { fontFamily: F.sansSemiBold, fontSize: 15, color: C.onDark },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: C.hairline },
  orText: { fontFamily: F.mono, fontSize: 11, color: C.ink3, letterSpacing: 1 },

  createBtn: {
    backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18,
    alignItems: 'center',
  },
  createBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },

  signInText: { fontFamily: F.sans, fontSize: 14, color: C.ink2, textAlign: 'center' },
  signInLink: { fontFamily: F.sansSemiBold, color: C.ink1, textDecorationLine: 'underline' },
})