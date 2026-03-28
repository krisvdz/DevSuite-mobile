// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: Context API + AsyncStorage no React Native
//
// Mesma lógica do web, mas trocamos localStorage por AsyncStorage.
// AsyncStorage é ASSÍNCRONO — por isso o estado inicial é null (loading)
// e precisamos de um estado `isLoading` para mostrar a splash screen
// enquanto verificamos se existe token salvo.
//
// Expo Router usa o estado do context para decidir qual rota exibir:
// autenticado → (app), não autenticado → (auth)
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api, TOKEN_KEY } from '../services/api'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean        // true enquanto verifica o token no AsyncStorage
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Ao montar: verifica token salvo e busca dados do usuário
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY)
        if (savedToken) {
          // 📚 CONCEITO: O Axios já coloca o body da resposta em `response.data`
          // O backend retorna o objeto User diretamente (sem wrapper),
          // então `data` aqui já é o User.
          const { data } = await api.get<User>('/auth/me')
          setToken(savedToken)
          setUser(data)
        }
      } catch {
        // Token expirado ou inválido → limpa
        await AsyncStorage.removeItem(TOKEN_KEY)
      } finally {
        setIsLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    // 📚 CONCEITO: Estrutura da resposta do Axios
    // axios.post() retorna { data, status, headers, ... }
    // `data` aqui é o body da resposta HTTP — o que o backend enviou.
    // O backend envia: { token: "...", user: {...} }
    // Logo: data.token e data.user — sem wrapper extra.
    const { data } = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { email, password }
    )
    const { token: newToken, user: newUser } = data
    await AsyncStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>(
      '/auth/register',
      { name, email, password }
    )
    const { token: newToken, user: newUser } = data
    await AsyncStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
