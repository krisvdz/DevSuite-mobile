// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: Root Layout — Expo Router
//
// Expo Router usa sistema de arquivos para rotas (como Next.js):
//   app/_layout.tsx        → layout raiz (providers globais)
//   app/(auth)/login.tsx   → rota /login (grupo auth, sem tab bar)
//   app/(app)/index.tsx    → rota / dentro do grupo app (com tab bar)
//
// O _layout.tsx raiz é o lugar certo para:
//   - Providers globais (QueryClient, AuthContext)
//   - Splash screen
//   - Configuração do StatusBar
//   - Stack navigator raiz
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { AuthProvider } from '../contexts/AuthContext'
import { Colors } from '../constants/theme'

// Evita que a splash screen feche antes de estarmos prontos
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
})

export default function RootLayout() {
  useEffect(() => {
    // Esconde a splash screen após o primeiro render
    SplashScreen.hideAsync()
  }, [])

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" backgroundColor={Colors.bg} />
          <Stack screenOptions={{ headerShown: false }}>
            {/* Grupo de autenticação — sem tab bar */}
            <Stack.Screen name="(auth)" />
            {/* Grupo principal — com tab bar */}
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
