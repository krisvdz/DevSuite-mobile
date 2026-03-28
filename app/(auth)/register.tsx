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

export default function RegisterScreen() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!name.trim() || name.trim().length < 2) e.name = 'Nome deve ter ao menos 2 caracteres'
    if (!email.trim()) e.email = 'Email é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido'
    if (!password || password.length < 6) e.password = 'Senha deve ter ao menos 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleRegister() {
    if (!validate()) return
    setLoading(true)
    try {
      await register(name.trim(), email.trim().toLowerCase(), password)
      router.replace('/(app)')
    } catch (err: any) {
      const isNetworkError = !err?.response
      const msg = isNetworkError
        ? `Servidor inacessível. Verifique se a API está rodando na porta 4000.\n\n(${err?.message ?? 'Network Error'})`
        : (err?.response?.data?.error ?? 'Erro ao criar conta')
      Alert.alert('Erro', msg)
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
        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Comece a usar o DevSuite gratuitamente</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            autoCapitalize="words"
            error={errors.name}
          />
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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            error={errors.password}
          />

          <Button
            label="Criar conta"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            Já tem conta?{' '}
            <Text style={styles.footerLink}>Entrar</Text>
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
  header: { gap: Spacing.xs },
  title: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textMuted },
  form: { gap: Spacing.md },
  submitBtn: { marginTop: Spacing.sm },
  footer: { alignItems: 'center' },
  footerText: { fontSize: Typography.sm, color: Colors.textMuted },
  footerLink: { color: Colors.violet, fontWeight: '600' },
})
