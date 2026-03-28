// Dev Pulse — GitHub trending repos

import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Linking, ScrollView, TextInput, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { GithubRepo } from '../../types'
import { Colors, Spacing, Typography, Radius, LANG_COLORS } from '../../constants/theme'

const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Kotlin',
]

function formatNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `${days}d atrás`
  return `${Math.floor(days / 30)}m atrás`
}

function RepoCard({ repo }: { repo: GithubRepo }) {
  const langColor = LANG_COLORS[repo.language ?? ''] ?? Colors.violet

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(repo.html_url)}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.cardTop}>
        <Text style={styles.repoName} numberOfLines={1}>{repo.full_name}</Text>
        <Ionicons name="open-outline" size={14} color={Colors.textMuted} />
      </View>

      {repo.description && (
        <Text style={styles.repoDesc} numberOfLines={2}>{repo.description}</Text>
      )}

      {repo.topics.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topics}>
          {repo.topics.slice(0, 3).map((t) => (
            <View key={t} style={styles.topicChip}>
              <Text style={styles.topicText}>{t}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.cardFooter}>
        {repo.language && (
          <View style={styles.langBadge}>
            <View style={[styles.langDot, { backgroundColor: langColor }]} />
            <Text style={styles.langText}>{repo.language}</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Ionicons name="star-outline" size={12} color={Colors.amber} />
          <Text style={styles.statText}>{formatNum(repo.stargazers_count)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="git-branch-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.statText}>{formatNum(repo.forks_count)}</Text>
        </View>
        <Text style={styles.timeAgo}>{timeAgo(repo.updated_at)}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function DevPulseScreen() {
  const [selectedLang, setSelectedLang] = useState<string | null>('TypeScript')
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch, isFetching } = useQuery<GithubRepo[]>({
    queryKey: ['github-trending', selectedLang],
    enabled: selectedLang !== null,
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
      const lang = selectedLang!.toLowerCase().replace('+', 'plus').replace('#', 'sharp')
      const q = `stars:>1000 language:${lang} pushed:>${since}`
      const res = await axios.get('https://api.github.com/search/repositories', {
        params: { q, sort: 'stars', order: 'desc', per_page: 20 },
        headers: { Accept: 'application/vnd.github.v3+json' },
      })
      return res.data.items as GithubRepo[]
    },
    staleTime: 1000 * 60 * 5,
  })

  const filtered = (data ?? []).filter((r) =>
    search
      ? r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      : true
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="trending-up" size={20} color={Colors.blue} />
          <Text style={styles.title}>Dev Pulse</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn} disabled={isFetching}>
            <Ionicons
              name="refresh"
              size={16}
              color={Colors.textMuted}
              style={isFetching ? styles.spinning : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={14} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar repositório..."
            placeholderTextColor={Colors.textPlaceholder}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Language chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.langList}
        >
          {LANGUAGES.map((lang) => {
            const active = selectedLang === lang
            const color = LANG_COLORS[lang] ?? Colors.blue
            return (
              <TouchableOpacity
                key={lang}
                onPress={() => setSelectedLang((p) => (p === lang ? null : lang))}
                style={[styles.langChip, active && { borderColor: color + '80', backgroundColor: color + '20' }]}
              >
                <View style={[styles.chipDot, { backgroundColor: color }]} />
                <Text style={[styles.chipText, active && { color: Colors.textPrimary }]}>{lang}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {selectedLang === null && (
        <View style={styles.emptyState}>
          <Ionicons name="code-slash-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Selecione uma linguagem</Text>
          <Text style={styles.emptySubtitle}>Escolha uma linguagem acima para explorar repositórios trending</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.errorText}>GitHub API com rate limit</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <RepoCard repo={item} />}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{filtered.length} repositórios</Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  refreshBtn: { padding: 4 },
  spinning: { opacity: 0.5 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  searchIcon: { marginLeft: 4 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  langList: { gap: Spacing.xs, paddingBottom: Spacing.xs },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textMuted },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  resultCount: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: Spacing.xs },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  repoName: { flex: 1, fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  repoDesc: { fontSize: Typography.xs, color: Colors.textMuted, lineHeight: 18 },
  topics: { flexGrow: 0 },
  topicChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.blueDim,
    borderWidth: 1,
    borderColor: Colors.blue + '30',
    marginRight: 4,
  },
  topicText: { fontSize: 10, color: Colors.blue },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  langBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  langDot: { width: 8, height: 8, borderRadius: 4 },
  langText: { fontSize: Typography.xs, color: Colors.textMuted },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: Typography.xs, color: Colors.textMuted },
  timeAgo: { fontSize: Typography.xs, color: Colors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  errorText: { fontSize: Typography.sm, color: Colors.textMuted },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.blueDim,
    borderRadius: Radius.md,
  },
  retryText: { fontSize: Typography.sm, color: Colors.blue, fontWeight: '600' },
})
