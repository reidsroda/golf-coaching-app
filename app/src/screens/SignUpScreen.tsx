import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ImageBackground, TextInput, Alert, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C, F } from '../theme'

const TOPO_BG = { uri: 'https://res.cloudinary.com/dtihqaiut/image/upload/v1780335688/TopographicBackground_n5rvzu.png' }

export default function SignUpScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing info', 'Please enter your first and last name.')
      return
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please enter your email and password.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: `${firstName.trim()} ${lastName.trim()}`,
        }
      }
    })

    if (error) {
      Alert.alert('Sign up failed', error.message)
      setLoading(false)
      return
    }

    // Save name to users table
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        full_name: `${firstName.trim()} ${lastName.trim()}`,
      })
    }

    setLoading(false)
    navigation.navigate('OnboardingGolfInfo')
  }

  return (
    <ImageBackground source={TOPO_BG} style={s.root} imageStyle={s.topoBg}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo + dots */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Ionicons name="golf" size={22} color={C.fairway} />
          </View>
        </View>
        <View style={s.dots}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>

        <Text style={s.eyebrow}>CREATE ACCOUNT</Text>
        <Text style={s.title}>Welcome to</Text>
        <Text style={s.titleItalic}>Tap in.</Text>
        <Text style={s.subtitle}>Hold onto your good swing thoughts. Stay consistent with the habits that work.</Text>

        {/* Form */}
        <View style={s.nameRow}>
          <View style={s.nameField}>
            <Text style={s.label}>FIRST NAME</Text>
            <TextInput
              style={s.input}
              placeholder="Alex"
              placeholderTextColor={C.ink3}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>
          <View style={s.nameField}>
            <Text style={s.label}>LAST NAME</Text>
            <TextInput
              style={s.input}
              placeholder="Morgan"
              placeholderTextColor={C.ink3}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <Text style={s.label}>EMAIL</Text>
        <TextInput
          style={[s.input, s.inputFull]}
          placeholder="you@email.com"
          placeholderTextColor={C.ink3}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={s.passwordHeader}>
          <Text style={s.label}>PASSWORD</Text>
          <Text style={s.passwordHint}>8+ characters</Text>
        </View>
        <View style={s.passwordWrap}>
          <TextInput
            style={s.passwordInput}
            placeholder="••••••••"
            placeholderTextColor={C.ink3}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
            <Text style={s.showText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.spacer} />

        <TouchableOpacity style={s.createBtn} onPress={handleCreate} disabled={loading}>
          <Text style={s.createBtnText}>{loading ? 'Creating account…' : 'Create account →'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={s.signInText}>
            Already have an account? <Text style={s.signInLink}>Log in</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  topoBg: { opacity: 0.55, resizeMode: 'cover' },
  container: { padding: 24, paddingTop: 60 },

  logoWrap: { marginBottom: 24 },
  logoCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  dot: { width: 20, height: 4, borderRadius: 2, backgroundColor: C.bunker },
  dotActive: { width: 32, backgroundColor: C.fairway },

  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.ink3, marginBottom: 6 },
  title: { fontFamily: F.serifBold, fontSize: 36, color: C.ink1, lineHeight: 42 },
  titleItalic: { fontFamily: F.serifBoldItalic, fontSize: 36, color: C.ink1, lineHeight: 42, marginBottom: 12 },
  subtitle: { fontFamily: F.sans, fontSize: 14, color: C.ink2, lineHeight: 21, marginBottom: 28 },

  nameRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  nameField: { flex: 1 },
  label: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink3, marginBottom: 8 },
  input: { backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 14, fontFamily: F.sans, fontSize: 15, color: C.ink1 },
  inputFull: { marginBottom: 16 },

  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  passwordHint: { fontFamily: F.mono, fontSize: 10, color: C.ink3 },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, marginBottom: 24 },
  passwordInput: { flex: 1, paddingVertical: 14, fontFamily: F.sans, fontSize: 15, color: C.ink1 },
  showText: { fontFamily: F.mono, fontSize: 11, color: C.ink2, letterSpacing: 0.5 },

  spacer: { height: 8 },
  createBtn: { backgroundColor: C.fairwayDark, borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  createBtnText: { fontFamily: F.sansSemiBold, fontSize: 16, color: C.onDark },
  signInText: { fontFamily: F.sans, fontSize: 14, color: C.ink2, textAlign: 'center' },
  signInLink: { fontFamily: F.sansSemiBold, color: C.ink1, textDecorationLine: 'underline' },
})