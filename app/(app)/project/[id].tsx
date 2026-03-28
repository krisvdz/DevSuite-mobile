// ─────────────────────────────────────────────────────────────────────────────
// Kanban Board — mobile
//
// 📚 CONCEITO: UX mobile vs web
// Drag-and-drop em telas pequenas é difícil de usar.
// O padrão nativo é: toque longo (long press) → bottom sheet com opções,
// ou toque no status badge → modal de seleção.
// Aqui: toque no card → ActionSheet com opções de mover entre colunas.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useProject, useCreateTask, useUpdateTask, useDeleteTask } from '../../../hooks/useProjects'
import { Task, TaskStatus } from '../../../types'
import { Colors, Spacing, Typography, Radius } from '../../../constants/theme'
import { Button } from '../../../components/ui/Button'

const COLUMNS: { status: TaskStatus; label: string; color: string; dot: string }[] = [
  { status: 'TODO',        label: 'A Fazer',      color: Colors.amber,        dot: Colors.amber },
  { status: 'IN_PROGRESS', label: 'Em Progresso', color: Colors.blue,         dot: Colors.blue },
  { status: 'DONE',        label: 'Concluído',    color: Colors.emerald,      dot: Colors.emerald },
]

function StatusBadge({ status, onPress }: { status: TaskStatus; onPress: () => void }) {
  const col = COLUMNS.find((c) => c.status === status)!
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.badge, { borderColor: col.dot + '40', backgroundColor: col.dot + '15' }]}
    >
      <View style={[styles.badgeDot, { backgroundColor: col.dot }]} />
      <Text style={[styles.badgeText, { color: col.color }]}>{col.label}</Text>
      <Ionicons name="chevron-down" size={10} color={col.color} />
    </TouchableOpacity>
  )
}

function TaskItem({ task, projectId }: { task: Task; projectId: string }) {
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)

  function handleStatusChange(status: TaskStatus) {
    updateTask.mutate({ taskId: task.id, data: { status } })
    setShowStatusModal(false)
  }

  function handleTitleSave() {
    if (title.trim() && title !== task.title) {
      updateTask.mutate({ taskId: task.id, data: { title: title.trim() } })
    }
    setIsEditing(false)
  }

  function confirmDelete() {
    Alert.alert('Remover tarefa', `Remover "${task.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteTask.mutate(task.id) },
    ])
  }

  return (
    <>
      <View style={[styles.taskCard, task.status === 'DONE' && styles.taskDone]}>
        <View style={styles.taskTop}>
          {isEditing ? (
            <TextInput
              value={title}
              onChangeText={setTitle}
              onBlur={handleTitleSave}
              onSubmitEditing={handleTitleSave}
              autoFocus
              style={styles.taskTitleInput}
              selectionColor={Colors.violet}
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.taskTitleWrap}>
              <Text
                style={[styles.taskTitle, task.status === 'DONE' && styles.taskTitleDone]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        <StatusBadge status={task.status} onPress={() => setShowStatusModal(true)} />
      </View>

      {/* Status picker modal */}
      <Modal visible={showStatusModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowStatusModal(false)}>
          <View style={styles.statusSheet}>
            <Text style={styles.statusSheetTitle}>Mover tarefa</Text>
            {COLUMNS.map((col) => (
              <TouchableOpacity
                key={col.status}
                onPress={() => handleStatusChange(col.status)}
                style={[styles.statusOption, task.status === col.status && styles.statusOptionActive]}
              >
                <View style={[styles.badgeDot, { backgroundColor: col.dot }]} />
                <Text style={[styles.statusOptionText, { color: col.color }]}>{col.label}</Text>
                {task.status === col.status && (
                  <Ionicons name="checkmark" size={16} color={col.dot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: project, isLoading } = useProject(id!)
  const createTask = useCreateTask(id!)

  const [activeCol, setActiveCol] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [selectedTab, setSelectedTab] = useState<TaskStatus>('TODO')

  const tasks = project?.tasks ?? []
  const tabTasks = tasks.filter((t) => t.status === selectedTab).sort((a, b) => a.order - b.order)
  const donePct = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.status === 'DONE').length / tasks.length) * 100)
    : 0

  async function handleAddTask() {
    if (!newTitle.trim()) return
    await createTask.mutateAsync({ title: newTitle.trim(), status: selectedTab })
    setNewTitle('')
    setActiveCol(null)
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.violet} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.projectName} numberOfLines={1}>{project?.name}</Text>
          {tasks.length > 0 && (
            <Text style={styles.projectProgress}>{donePct}% concluído</Text>
          )}
        </View>
        {tasks.length > 0 && (
          <Text style={styles.progressCount}>
            {tasks.filter((t) => t.status === 'DONE').length}/{tasks.length}
          </Text>
        )}
      </View>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${donePct}%` }]} />
        </View>
      )}

      {/* Column tabs */}
      <View style={styles.tabs}>
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.status).length
          const active = selectedTab === col.status
          return (
            <TouchableOpacity
              key={col.status}
              onPress={() => setSelectedTab(col.status)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <View style={[styles.tabDot, { backgroundColor: col.dot }]} />
              <Text style={[styles.tabText, active && { color: Colors.textPrimary }]}>
                {col.label}
              </Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{count}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Add task inline */}
      {activeCol === selectedTab ? (
        <View style={styles.addForm}>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Título da tarefa..."
            placeholderTextColor={Colors.textPlaceholder}
            style={styles.addInput}
            autoFocus
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <View style={styles.addActions}>
            <Button label="Adicionar" onPress={handleAddTask} loading={createTask.isPending} size="sm" />
            <Button label="Cancelar" variant="ghost" onPress={() => setActiveCol(null)} size="sm" />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setActiveCol(selectedTab)}
          style={styles.addTrigger}
        >
          <Ionicons name="add-circle-outline" size={16} color={Colors.violet} />
          <Text style={styles.addTriggerText}>Adicionar tarefa</Text>
        </TouchableOpacity>
      )}

      {/* Task list */}
      <FlatList
        data={tabTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.taskList}
        renderItem={({ item }) => <TaskItem task={item} projectId={id!} />}
        ListEmptyComponent={
          <View style={styles.emptyCol}>
            <Text style={styles.emptyColEmoji}>
              {selectedTab === 'TODO' ? '📝' : selectedTab === 'IN_PROGRESS' ? '⚡' : '✅'}
            </Text>
            <Text style={styles.emptyColText}>Sem tarefas aqui</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerText: { flex: 1 },
  projectName: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  projectProgress: { fontSize: Typography.xs, color: Colors.textMuted },
  progressCount: { fontSize: Typography.xs, color: Colors.textMuted },
  progressBar: {
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.violet,
    borderRadius: Radius.full,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.violetDim,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  tabText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textMuted },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    borderStyle: 'dashed',
  },
  addTriggerText: { fontSize: Typography.sm, color: Colors.violet },
  addForm: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  addInput: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  addActions: { flexDirection: 'row', gap: Spacing.xs },
  taskList: { paddingHorizontal: Spacing.lg, paddingBottom: 80, gap: Spacing.sm },
  taskCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  taskDone: { opacity: 0.6 },
  taskTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  taskTitleWrap: { flex: 1 },
  taskTitle: { fontSize: Typography.sm, fontWeight: '500', color: Colors.textPrimary, lineHeight: 20 },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskTitleInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.violet,
    paddingVertical: 2,
  },
  deleteBtn: { padding: 2, opacity: 0.5 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: Typography.xs, fontWeight: '600' },
  emptyCol: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyColEmoji: { fontSize: 32 },
  emptyColText: { fontSize: Typography.sm, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  statusSheet: {
    backgroundColor: Colors.elevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '75%',
    gap: Spacing.sm,
  },
  statusSheetTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  statusOptionActive: { backgroundColor: 'rgba(139,92,246,0.1)' },
  statusOptionText: { flex: 1, fontSize: Typography.sm, fontWeight: '600' },
})
