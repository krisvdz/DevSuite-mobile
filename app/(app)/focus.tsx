// ─────────────────────────────────────────────────────────────────────────────
// Focus Timer — Pomodoro
//
// 📚 CONCEITO: AppState no React Native = visibilitychange no browser
//
// No mobile, quando o usuário sai do app (manda para segundo plano),
// o OS pode pausar a execução do JavaScript — igual ao browser throttlando
// abas inativas, mas muito mais agressivo.
//
// Solução idêntica ao web: deadline-based timer
//   deadline = Date.now() + timeLeft * 1000
//   a cada tick: remaining = Math.round((deadline - Date.now()) / 1000)
//
// AppState.addEventListener('change', handler):
//   'active'     → app voltou ao foco (= document.hidden === false)
//   'background' → app foi para segundo plano
//   'inactive'   → transição (somente iOS, ex: ligação recebida)
//
// Ao voltar para 'active': recalcula timeLeft do deadline, corrigindo
// qualquer tempo perdido enquanto o app estava em background.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, AppState, AppStateStatus,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { focusApi } from '../../services/api'
import { FocusStats } from '../../types'
import { Colors, Spacing, Typography, Radius } from '../../constants/theme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type TimerMode = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK'

const MODES: Record<TimerMode, { label: string; seconds: number; color: string; gradStart: string; gradEnd: string }> = {
  WORK:        { label: 'Foco',        seconds: 25 * 60, color: Colors.emerald,   gradStart: '#10b981', gradEnd: '#14b8a6' },
  SHORT_BREAK: { label: 'Pausa curta', seconds: 5 * 60,  color: Colors.blue,      gradStart: '#3b82f6', gradEnd: '#06b6d4' },
  LONG_BREAK:  { label: 'Pausa longa', seconds: 15 * 60, color: Colors.violetLight, gradStart: '#8b5cf6', gradEnd: '#a78bfa' },
}

const RADIUS = 90
const STROKE = 10
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function FocusScreen() {
  const [mode, setMode] = useState<TimerMode>('WORK')
  const [timeLeft, setTimeLeft] = useState(MODES.WORK.seconds)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)

  // Deadline-based refs — mesma lógica do web
  const deadlineRef = useRef<number>(0)
  const isRunningRef = useRef(false)
  const handleCompleteRef = useRef<() => void>(() => {})
  isRunningRef.current = isRunning

  // Animated stroke offset (react-native-reanimated)
  const progress = useSharedValue(1) // 1 = cheio, 0 = vazio
  const currentMode = MODES[mode]

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(
      CIRCUMFERENCE * (1 - progress.value),
      { duration: 500, easing: Easing.out(Easing.quad) }
    ),
  }))

  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['focus-stats'],
    queryFn: async () => {
      const { data } = await focusApi.getStats()
      return data.data as FocusStats
    },
  })

  const saveSession = useMutation({
    mutationFn: focusApi.saveSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['focus-stats'] }),
  })

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsRunning(false)
    deadlineRef.current = 0
    setMode(newMode)
    setTimeLeft(MODES[newMode].seconds)
    progress.value = 1
  }, [progress])

  const handleComplete = useCallback(() => {
    setIsRunning(false)
    deadlineRef.current = 0
    progress.value = 0

    if (mode === 'WORK') {
      const newCount = sessionCount + 1
      setSessionCount(newCount)
      saveSession.mutate({ duration: MODES.WORK.seconds, type: 'WORK' })
      switchMode(newCount % 4 === 0 ? 'LONG_BREAK' : 'SHORT_BREAK')
    } else {
      switchMode('WORK')
    }
  }, [mode, sessionCount, saveSession, switchMode, progress])

  handleCompleteRef.current = handleComplete

  function toggleRunning() {
    if (!isRunning) {
      deadlineRef.current = Date.now() + timeLeft * 1000
    }
    setIsRunning((v) => !v)
  }

  // Intervalo principal — deadline-based, não decrementa
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      if (!deadlineRef.current) return
      const remaining = Math.round((deadlineRef.current - Date.now()) / 1000)
      if (remaining <= 0) {
        handleCompleteRef.current()
      } else {
        setTimeLeft(remaining)
        progress.value = remaining / MODES[mode].seconds
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isRunning, mode, progress])

  // AppState: recalcula ao voltar do background
  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'active' && isRunningRef.current && deadlineRef.current) {
        const remaining = Math.round((deadlineRef.current - Date.now()) / 1000)
        if (remaining <= 0) {
          handleCompleteRef.current()
        } else {
          setTimeLeft(remaining)
          progress.value = remaining / MODES[mode].seconds
        }
      }
    }

    const sub = AppState.addEventListener('change', handleAppStateChange)
    return () => sub.remove()
  }, [mode, progress])

  // Weekly chart
  const weeklyData = stats?.weeklyMinutes ? Object.entries(stats.weeklyMinutes) : []
  const maxMin = Math.max(...weeklyData.map(([, v]) => v), 1)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="timer-outline" size={20} color={Colors.emerald} />
          <Text style={styles.title}>Focus Timer</Text>
        </View>

        {/* Mode selector */}
        <View style={styles.modeTabs}>
          {(Object.keys(MODES) as TimerMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => switchMode(m)}
              style={[styles.modeTab, mode === m && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                {MODES[m].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SVG Ring Timer */}
        <View style={styles.ringContainer}>
          <Svg width={220} height={220} viewBox="0 0 220 220">
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={currentMode.gradStart} />
                <Stop offset="1" stopColor={currentMode.gradEnd} />
              </LinearGradient>
            </Defs>
            {/* Track */}
            <Circle
              cx={110} cy={110} r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={STROKE}
            />
            {/* Animated progress */}
            <AnimatedCircle
              cx={110} cy={110} r={RADIUS}
              fill="none"
              stroke="url(#grad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedProps}
              rotation="-90"
              origin="110, 110"
            />
          </Svg>

          {/* Center content */}
          <View style={styles.ringCenter}>
            <Text style={[styles.timeText, { color: currentMode.color }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={styles.modeLabel}>{currentMode.label}</Text>
            {sessionCount > 0 && (
              <View style={styles.sessionDots}>
                {Array.from({ length: Math.min(sessionCount, 6) }).map((_, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: Colors.emerald }]} />
                ))}
                {sessionCount > 6 && (
                  <Text style={styles.dotExtra}>+{sessionCount - 6}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => switchMode(mode)} style={styles.iconBtn}>
            <Ionicons name="refresh" size={22} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleRunning}
            style={[styles.playBtn, { backgroundColor: currentMode.gradStart }]}
          >
            <Ionicons name={isRunning ? 'pause' : 'play'} size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.sessionCounter}>
            <Ionicons name="flame" size={20} color={sessionCount > 0 ? Colors.amber : Colors.textMuted} />
            <Text style={[styles.sessionNum, sessionCount > 0 && { color: Colors.textPrimary }]}>
              {sessionCount}
            </Text>
          </View>
        </View>

        {/* Today stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.emerald }]}>{stats?.todaySessions ?? 0}</Text>
            <Text style={styles.statLabel}>Sessões hoje</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.blue }]}>{stats?.todayMinutes ?? 0}</Text>
            <Text style={styles.statLabel}>Minutos hoje</Text>
          </View>
        </View>

        {/* Weekly bar chart */}
        {weeklyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Últimos 7 dias</Text>
            <View style={styles.chartBars}>
              {weeklyData.map(([date, minutes], i) => {
                const height = Math.max((minutes / maxMin) * 60, minutes > 0 ? 4 : 0)
                const dayIndex = new Date(date + 'T12:00:00').getDay()
                const isToday = i === weeklyData.length - 1
                return (
                  <View key={date} style={styles.barWrap}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height, backgroundColor: isToday ? Colors.emerald : 'rgba(255,255,255,0.15)' },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{DAY_LABELS[dayIndex]}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Pomodoro tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Técnica Pomodoro</Text>
          {[
            { icon: 'bulb-outline' as const, text: '25 min de foco total', color: Colors.emerald },
            { icon: 'cafe-outline' as const, text: '5 min de pausa curta', color: Colors.blue },
            { icon: 'moon-outline' as const, text: 'Pausa longa a cada 4 sessões', color: Colors.violetLight },
          ].map((tip) => (
            <View key={tip.text} style={styles.tip}>
              <Ionicons name={tip.icon} size={14} color={tip.color} />
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 4,
  },
  modeTab: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, alignItems: 'center' },
  modeTabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  modeTabText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textMuted },
  modeTabTextActive: { color: Colors.textPrimary },
  ringContainer: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  timeText: { fontSize: 44, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  modeLabel: { fontSize: Typography.sm, color: Colors.textMuted },
  sessionDots: { flexDirection: 'row', gap: 4, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotExtra: { fontSize: Typography.xs, color: Colors.textMuted },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginVertical: Spacing.sm,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  sessionCounter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sessionNum: { fontSize: Typography.xs, fontWeight: '700', color: Colors.textMuted },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: Typography['2xl'], fontWeight: '800' },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  chartTitle: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 4 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '100%', borderRadius: 3, minHeight: 0 },
  barLabel: { fontSize: 10, color: Colors.textMuted },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  tipsTitle: { fontSize: Typography.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tipText: { fontSize: Typography.xs, color: Colors.textMuted },
})
