import { supabase } from './supabaseClient'
import type { Project, ProjectFilters, ProjectParticipant, ProjectStatus, VolunteerHour } from '../types'

function normalizeProject(row: any): Project {
  return {
    id: row.id,
    title: row.title,
    description_short: row.description_short ?? row.description_long ?? null,
    category_primary: row.category_primary ?? null,
    status: row.status,
    max_participants: row.max_participants ?? 0,
    created_by_id: row.created_by_id ?? row.creator_id,
    location_municipality: row.location_municipality ?? null,
    created_at: row.created_at,
    current_participants: row.current_participants ?? 0,
    skills_required: row.skills_required ?? [],
    budget_cost: row.budget_cost ?? 0,
    budget_spent: row.budget_spent ?? 0,
    website_url: row.website_url ?? null,
    attachment_url: row.attachment_url ?? null,
    attachment_name: row.attachment_name ?? null,
    result_summary: row.result_summary ?? null,
    result_photos: row.result_photos ?? [],
    completed_at: row.completed_at ?? null,
  }
}

export async function listProjectsFromApi(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['active', 'in_development'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(normalizeProject)
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? normalizeProject(data) : null
}

export async function createProject(input: {
  title: string
  description_short: string
  category_primary: string
  location_municipality: string
  max_participants: number
  created_by_id: string
  status?: ProjectStatus
  skills_required?: string[]
  budget_cost?: number
  website_url?: string
  attachment_url?: string
  attachment_name?: string
}) {
  const { error } = await supabase.from('projects').insert({
    ...input,
    creator_id: input.created_by_id,
    status: input.status || 'pending_review',
    created_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const updates: any = { status }
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
  if (error) throw error
}

export async function updateProjectResults(projectId: string, resultSummary: string, resultPhotos: string[]) {
  const { error } = await supabase
    .from('projects')
    .update({ result_summary: resultSummary, result_photos: resultPhotos })
    .eq('id', projectId)
  if (error) throw error
}

export async function updateProjectBudgetSpent(projectId: string, budgetSpent: number) {
  const { error } = await supabase
    .from('projects')
    .update({ budget_spent: budgetSpent })
    .eq('id', projectId)
  if (error) throw error
}

export async function uploadProjectFile(file: File, projectId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp']
  if (!ext || !allowed.includes(ext)) {
    throw new Error('Endast PDF och bilder (JPG, PNG, GIF, WebP) är tillåtna.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Filen får inte vara större än 10 MB.')
  }

  const path = `projects/${projectId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('attachments').upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from('attachments').getPublicUrl(path)
  return data.publicUrl
}

export async function applyToProject(input: ProjectParticipant) {
  const { error } = await supabase.from('project_participants').insert({
    project_id: input.project_id,
    user_id: input.user_id,
    role: input.role,
    hours_completed: input.hours_completed,
    status: input.status,
    created_at: new Date().toISOString(),
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

// --- Volunteer Hours ---

export async function logVolunteerHours(input: Omit<VolunteerHour, 'id' | 'created_at'>) {
  const { error } = await supabase.from('volunteer_hours').insert(input)
  if (error) throw error
}

export async function getVolunteerHoursForProject(projectId: string): Promise<VolunteerHour[]> {
  const { data, error } = await supabase
    .from('volunteer_hours')
    .select('*, users(full_name, email)')
    .eq('project_id', projectId)
    .order('logged_at', { ascending: false })

  if (error) throw error
  return data || []
}

// --- Matching ---

export function computeMatchScore(
  project: Project,
  userSkillNames: string[],
  userMunicipality?: string | null
) {
  const skills = project.skills_required || []
  const overlap =
    skills.length === 0
      ? 0.5
      : skills.filter((s) => userSkillNames.includes(s)).length / skills.length

  const municipalityScore =
    userMunicipality && project.location_municipality === userMunicipality ? 1 : 0.35
  const availabilityScore =
    (project.current_participants || 0) < (project.max_participants || 0) ? 1 : 0

  return Math.round(
    (overlap * 0.5 + municipalityScore * 0.3 + availabilityScore * 0.2) * 100
  )
}

export function filterAndSortProjects(
  projects: Project[],
  filters: ProjectFilters,
  userSkillNames: string[],
  userMunicipality?: string | null
) {
  let result = [...projects]

  if (filters.status) {
    result = result.filter((p) => p.status === filters.status)
  }
  if (filters.municipality) {
    result = result.filter((p) => p.location_municipality === filters.municipality)
  }
  if (filters.category) {
    result = result.filter((p) => p.category_primary === filters.category)
  }
  if (filters.skills && filters.skills.length > 0) {
    result = result.filter((p) => {
      const required = p.skills_required || []
      return required.some((skill) => filters.skills?.includes(skill))
    })
  }

  const withScore = result.map((p) => ({
    ...p,
    matchScore: computeMatchScore(p, userSkillNames, userMunicipality),
  }))

  const sortBy = filters.sortBy || 'best_match'
  if (sortBy === 'newest') return withScore.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  if (sortBy === 'popular') return withScore.sort((a, b) => (b.current_participants || 0) - (a.current_participants || 0))
  return withScore.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
}