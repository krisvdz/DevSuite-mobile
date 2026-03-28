// Dashboard — lista de projetos

import { useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, Alert, ActivityIndicator, TextInput,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useProjects, useCreateProject, useDeleteProject } from '../../hooks/useProjects'
import { useAuth } from '../../contexts/AuthContext'
import { Project } from '../../types'
import { Colors, Spacing, Typography, Radius, getProjectGradient } from '../../constants/theme'
import { Button } from '../../components/ui/Button'

function ProjectCard({
  project,
  index,
  onDelete,
}: {
  project: Project
  index: number
  onDelete: (id: string) => void
}) {
  const [start, end] = getProjectGradient(index)
  const taskCount = project._count?.tasks ?? 0

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/project/${project.id}`)}
      onLongPress={() => {
        Alert.alert('Excluir projeto', `Excluir "${project.name}"?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: () => onDelete(project.id) },
        ])
      }}
      activeOpacity={0.8}
      style={styles.card}
    >
      {/* Accent top border */}
      <View style={[styles.cardAccent, { backgroundColor: start }]} />

      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: start + '30' }]}>
          <Ionicons name="folder-open" size={18} color={start} />
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Excluir projeto', `Excluir "${project.name}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir', style: 'destructive', onPress: () => onDelete(project.id) },
            ])
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.cardMeta}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.cardName} numberOfLines={1}>{project.name}</Text>
      {project.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{project.description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Ionicons name="checkbox-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.cardCount}>
          {taskCount} tarefa{taskCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(project.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const { data, isLoading, isError } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()

  const [showModal, setShowModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')

  const projects = data?.data ?? []
  const totalTasks = projects.reduce((s, p) => s + (p._count?.tasks ?? 0), 0)

  async function handleCreate() {
    if (!projectName.trim()) return
    await createProject.mutateAsync({ name: projectName.trim(), description: projectDesc.trim() || undefined })
    setProjectName('')
    setProjectDesc('')
    setShowModal(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.stats}>
            <Text style={styles.statsViolet}>{projects.length} projeto{projects.length !== 1 ? 's' : ''}</Text>
            {'  ·  '}
            <Text style={styles.statsBlue}>{totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Section title */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Projetos</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={18} color={Colors.violet} />
          <Text style={styles.addBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.violet} />
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Erro ao carregar projetos</Text>
        </View>
      )}

      {!isLoading && projects.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhum projeto ainda</Text>
          <Text style={styles.emptySubtitle}>Crie seu primeiro projeto para começar</Text>
          <Button label="Criar projeto" onPress={() => setShowModal(true)} style={styles.emptyBtn} />
        </View>
      )}

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <ProjectCard
            project={item}
            index={index}
            onDelete={(id) => deleteProject.mutate(id)}
          />
        )}
      />

      {/* Modal: criar projeto */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Novo projeto</Text>

            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Nome do projeto"
              placeholderTextColor={Colors.textPlaceholder}
              style={styles.modalInput}
              autoFocus
            />
            <TextInput
              value={projectDesc}
              onChangeText={setProjectDesc}
              placeholder="Descrição (opcional)"
              placeholderTextColor={Colors.textPlaceholder}
              style={styles.modalInput}
              multiline
            />

            <View style={styles.modalActions}>
              <Button
                label="Cancelar"
                variant="secondary"
                onPress={() => { setShowModal(false); setProjectName(''); setProjectDesc('') }}
                style={styles.modalBtn}
              />
              <Button
                label="Criar"
                onPress={handleCreate}
                loading={createProject.isPending}
                disabled={!projectName.trim()}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const CARD_GAP = 12

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  stats: { fontSize: Typography.sm, marginTop: 2 },
  statsViolet: { color: Colors.violet, fontWeight: '600' },
  statsBlue: { color: Colors.blue, fontWeight: '600' },
  logoutBtn: { padding: Spacing.xs },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.violetDim,
  },
  addBtnText: { fontSize: Typography.xs, color: Colors.violet, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    overflow: 'hidden',
    gap: 6,
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBadge: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardMeta: {},
  cardName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  cardDesc: { fontSize: Typography.xs, color: Colors.textMuted, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardCount: { fontSize: Typography.xs, color: Colors.textMuted, flex: 1 },
  cardDate: { fontSize: Typography.xs, color: Colors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.rose },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  emptyBtn: { marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.elevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  modalBtn: { flex: 1 },
})
