// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: Bottom Tab Navigator — padrão mobile
//
// No mobile, a navegação principal é uma barra de abas na parte inferior
// (Tab Bar), ao contrário do web onde fica uma sidebar lateral.
//
// Expo Router usa <Tabs> do React Navigation internamente.
// Cada arquivo dentro de (app)/ vira uma aba automaticamente.
// ─────────────────────────────────────────────────────────────────────────────

import { Tabs, Redirect } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { Colors, Radius } from '../../constants/theme'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({
  name,
  color,
  focused,
}: {
  name: IoniconsName
  color: string
  focused: boolean
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  )
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  // Auth guard: se não autenticado, redireciona para login
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.violet,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'TaskFlow',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="devpulse"
        options={{
          title: 'Dev Pulse',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'trending-up' : 'trending-up-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'timer' : 'timer-outline'} color={color} focused={focused} />
          ),
        }}
      />
      {/* Rota de detalhe do projeto — não aparece na tab bar */}
      <Tabs.Screen
        name="project/[id]"
        options={{ href: null }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0b1120',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrap: {
    padding: 4,
    borderRadius: Radius.sm,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
})
