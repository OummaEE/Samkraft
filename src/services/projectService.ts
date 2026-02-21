import { supabase } from './supabaseClient'
import type { Project, ProjectFilters, ProjectParticipant } from '../types'

function normalizeProject(project: any): Project {
  return {
    id: project.id,
    title: project.title,
    description_short: project.description_short ?? project.description_long ?? null,
    category_primary: project.category_primary ?? null,
    status: project.status,
    max_participants: project.max_participants ?? 0,
    created_by_id: project.created_by_id ?? project.creator_id,
    location_municipality: project.location_municipality ?? null,
    created_at: project.created_at,
    current_participants: project.current_participants ?? 0,
    skills_required: project.skills_required ?? []
  }
}

export async function listProjectsFromApi(): Promise<Project[]> {
  const response = await fetch('/api/projects?status=active')
  if (!response.ok) throw new Error('Kunde inte hämta projekt')
  const payload: any = await response.json()
  return (payload.data || []).map(normalizeProject)
}

export async function getProjectById(id: string): Promise<Project | null> {
  const response = await fetch(`/api/projects/${id}`)
  if (!response.ok) return null

  const payload: any = await response.json()
  if (!payload.data) return null
  return normalizeProject(payload.data)
}

export async function createProject(input: {
  title: string
  description_short: string
  category_primary: string
  location_municipality: string
  max_participants: number
  created_by_id: string
  status?: string
  skills_required?: string[]
}) {
  const { error } = await supabase.from('projects').insert({
    ...input,
    status: input.status || 'active',
    created_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function applyToProject(input: ProjectParticipant) {
  const { error } = await supabase.from('project_participants').insert({
    project_id: input.project_id,
    user_id: input.user_id,
    role: input.role,
    hours_completed: input.hours_completed,
    status: input.status,
    created_at: new Date().toISOString()
  })

  if (error) throw error
}

export async function getProjectsByCreator(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('created_by_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizeProject)
}

export async function getApplicationsByUser(userId: string) {
  const { data, error } = await supabase
    .from('project_participants')
    .select('*, projects(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export function computeMatchScore(project: Project, userSkillNames: string[], userMunicipality?: string | null) {
  const skills = project.skills_required || []
  const overlap = skills.length === 0
    ? 0.5
    : skills.filter((s) => userSkillNames.includes(s)).length / skills.length

  const municipalityScore = userMunicipality && project.location_municipality === userMunicipality ? 1 : 0.35
  const availabilityScore = (project.current_participants || 0) < (project.max_participants || 0) ? 1 : 0

  return Math.round((overlap * 0.5 + municipalityScore * 0.3 + availabilityScore * 0.2) * 100)
}

export function filterAndSortProjects(
  projects: Project[],
  filters: ProjectFilters,
  userSkillNames: string[],
  userMunicipality?: string | null
) {
  let result = projects.filter((project) => project.status === (filters.status || 'active'))

  if (filters.municipality) {
    result = result.filter((project) => project.location_municipality === filters.municipality)
  }

  if (filters.category) {
    result = result.filter((project) => project.category_primary === filters.category)
  }

  result = result.filter((project) => (project.current_participants || 0) < (project.max_participants || Number.MAX_SAFE_INTEGER))

  if (filters.skills && filters.skills.length > 0) {
    result = result.filter((project) => {
      const required = project.skills_required || []
      return required.some((skill) => filters.skills?.includes(skill))
    })
  }

  const withScore = result.map((project) => ({
    ...project,
    matchScore: computeMatchScore(project, userSkillNames, userMunicipality)
  }))

  const sortBy = filters.sortBy || 'best_match'
  if (sortBy === 'newest') {
    return withScore.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  }

  if (sortBy === 'popular') {
    return withScore.sort((a, b) => (b.current_participants || 0) - (a.current_participants || 0))
  }

  return withScore.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
}
