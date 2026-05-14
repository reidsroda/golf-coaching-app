import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { supabase } from './src/lib/supabase'


export default function App() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    supabase.from('users').select('*').then(({ data, error }) => {
      if (error) {
        console.log('Supabase error:', error.message)
      } else {
        console.log('Supabase connected!')
        setConnected(true)
      }
    })
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{connected ? 'Supabase connected!' : 'Connecting...'}</Text>
    </View>
  )
}