// ─────────────────────────────────────────────────────────────────────────────
// Entry point — redireciona para (auth) ou (app) com base na sessão
// ─────────────────────────────────────────────────────────────────────────────

import { Redirect } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { Colors } from '../constants/theme'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()

  // Aguarda AsyncStorage verificar o token salvo
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.violet} />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/login'} />
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
})
