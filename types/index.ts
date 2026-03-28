// Tipos espelhados do backend — mesmos contratos da API REST

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type SessionType = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK'

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  order: number
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  userId: string
  createdAt: string
  updatedAt: string
  tasks?: Task[]
  _count?: { tasks: number }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  error: string
  code: string
}

export interface FocusStats {
  todaySessions: number
  todayMinutes: number
  weeklyMinutes: Record<string, number>
}

export interface GithubRepo {
  id: number
  full_name: string
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  updated_at: string
  owner: { avatar_url: string; login: string }
}
