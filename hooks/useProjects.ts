import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, tasksApi } from '../services/api'
import { Project, PaginatedResponse, Task } from '../types'
import { AxiosError } from 'axios'

const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: async () => {
      const { data } = await projectsApi.list()
      return data as PaginatedResponse<Project>
    },
    staleTime: 1000 * 60,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async () => {
      const { data } = await projectsApi.getById(id)
      return data as Project & { tasks: Task[] }
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      projectsApi.create(data).then((r) => r.data as Project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
    },
  })
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; status?: string }) =>
      tasksApi.create(projectId, data).then((r) => r.data as Task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    },
    onError: (e: AxiosError<{ error: string }>) => {
      console.warn('Erro ao criar tarefa:', e.response?.data?.error)
    },
  })
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: { title?: string; status?: string } }) =>
      tasksApi.update(projectId, taskId, data).then((r) => r.data as Task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    },
  })
}
