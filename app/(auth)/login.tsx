import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Colors, Spacing, Typography, Radius } from '../../constants/theme'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'Email é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido'
    if (!password) e.password = 'Senha é obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleLogin() {
    if (!validate()) return
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      router.replace('/(app)')
    } catch (err: any) {
      const isNetworkError = !err?.response
      const msg = isNetworkError
        ? `Servidor inacessível. Verifique se a API está rodando na porta 4000.\n\n(${err?.message ?? 'Network Error'})`
        : (err?.response?.data?.error ?? 'Credenciais inválidas')
      Alert.alert('Erro ao entrar', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>DS</Text>
          </View>
          <Text style={styles.title}>DevSuite</Text>
          <Text style={styles.subtitle}>Sua suite de produtividade dev</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          <Button
            label="Entrar"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            Não tem conta?{' '}
            <Text style={styles.footerLink}>Criar conta</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.xl,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    backgroundColor: Colors.violetDim,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  logoText: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.violet },
  title: { fontSize: Typography['3xl'], fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textMuted },
  form: { gap: Spacing.md },
  submitBtn: { marginTop: Spacing.sm },
  footer: { alignItems: 'center' },
  footerText: { fontSize: Typography.sm, color: Colors.textMuted },
  footerLink: { color: Colors.violet, fontWeight: '600' },
})
