// ─────────────────────────────────────────────────────────────────────────────
// Design System — DevSuite Mobile
// Paleta idêntica ao web (dark theme #0a0f1e)
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // Backgrounds
  bg: '#0a0f1e',         // tela principal
  surface: '#0d1526',    // cards
  surfaceHover: '#111b32',
  elevated: '#131f38',   // modals, sheets

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',

  // Brand
  violet: '#8b5cf6',
  violetLight: '#a78bfa',
  violetDim: 'rgba(139,92,246,0.15)',

  blue: '#3b82f6',
  blueLight: '#60a5fa',
  blueDim: 'rgba(59,130,246,0.15)',

  emerald: '#10b981',
  emeraldLight: '#34d399',
  emeraldDim: 'rgba(16,185,129,0.15)',

  amber: '#f59e0b',
  orange: '#f97316',
  rose: '#f43f5e',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#4b5563',
  textPlaceholder: '#374151',

  // Status
  statusTodo: '#6b7280',
  statusProgress: '#3b82f6',
  statusDone: '#10b981',

  // Tab bar
  tabActive: '#8b5cf6',
  tabInactive: '#4b5563',
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const

// Gradiente dos projetos (por índice)
export const PROJECT_GRADIENTS: [string, string][] = [
  ['#8b5cf6', '#7c3aed'],
  ['#3b82f6', '#06b6d4'],
  ['#10b981', '#14b8a6'],
  ['#f97316', '#f43f5e'],
  ['#ec4899', '#fb7185'],
  ['#f59e0b', '#f97316'],
]

export function getProjectGradient(index: number): [string, string] {
  return PROJECT_GRADIENTS[index % PROJECT_GRADIENTS.length]
}

// Cores por linguagem (Dev Pulse)
export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  Kotlin: '#A97BFF',
}
