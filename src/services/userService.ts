import { supabase } from './supabaseClient'
import type { UserProfile, UserRole, UserSkill } from '../types'

function mapRole(role: string | null | undefined): UserRole {
  if (role === 'migrant' || role === 'volunteer' || role === 'mentor' || role === 'municipality_admin') {
    return role
  }
  return 'volunteer'
}

export async function createProfile(params: {
  id: string
  email: string
  fullName: string
  role: UserRole
  municipality?: string
}) {
  const username = params.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()

  const { error } = await supabase.from('users').upsert(
    {
      id: params.id,
      email: params.email,
      full_name: params.fullName,
      role: params.role,
      municipality: params.municipality ?? null,
      username,
      created_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  )

  if (error) throw error
}

export async function getCurrentUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name || data.first_name || '',
    role: mapRole(data.role),
    municipality: data.municipality || data.location_municipality || null,
    bio: data.bio || null,
    avatar_url: data.avatar_url || data.profile_photo_url || null,
    username: data.username || null,
    created_at: data.created_at || new Date().toISOString()
  }
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const payload = {
    full_name: updates.full_name,
    municipality: updates.municipality,
    bio: updates.bio,
    avatar_url: updates.avatar_url,
    role: updates.role,
    username: updates.username
  }

  const { error } = await supabase.from('users').update(payload).eq('id', userId)
  if (error) throw error
}

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(username)
  const query = supabase.from('users').select('*')
  const { data, error } = isUuid
    ? await query.eq('id', username).maybeSingle()
    : await query.eq('username', username).maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name || data.first_name || '',
    role: mapRole(data.role),
    municipality: data.municipality || data.location_municipality || null,
    bio: data.bio || null,
    avatar_url: data.avatar_url || data.profile_photo_url || null,
    username: data.username || null,
    created_at: data.created_at || new Date().toISOString()
  }
}

export async function getUserSkills(userId: string): Promise<UserSkill[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('id, user_id, skill_id, proficiency_level, skills(id, name, category)')
    .eq('user_id', userId)

  if (error) throw error
  return (data || []).map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    skill_id: item.skill_id,
    proficiency_level: item.proficiency_level,
    skills: Array.isArray(item.skills) ? item.skills[0] : item.skills
  }))
}

export async function setUserSkills(userId: string, items: Array<{ skill_id: string; proficiency_level: number }>) {
  const { error: deleteError } = await supabase.from('user_skills').delete().eq('user_id', userId)
  if (deleteError) throw deleteError

  if (items.length === 0) return

  const payload = items.map((item) => ({
    user_id: userId,
    skill_id: item.skill_id,
    proficiency_level: item.proficiency_level
  }))
  const { error } = await supabase.from('user_skills').insert(payload)
  if (error) throw error
}

export async function getMunicipalities() {
  const { data, error } = await supabase
    .from('municipalities')
    .select('id, name, budget_allocated, budget_spent')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, category')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getPublicPortfolioByUserId(userId: string) {
  const [projectsResult, certificatesResult, skillsResult] = await Promise.all([
    supabase
      .from('project_participants')
      .select('project_id, hours_completed, status')
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('certificates')
      .select('id')
      .eq('user_id', userId),
    supabase
      .from('user_skills')
      .select('skill_id')
      .eq('user_id', userId)
  ])

  if (projectsResult.error) throw projectsResult.error
  if (certificatesResult.error) throw certificatesResult.error
  if (skillsResult.error) throw skillsResult.error

  const completedProjects = projectsResult.data || []
  const totalHours = completedProjects.reduce((sum: number, item: any) => sum + Number(item.hours_completed || 0), 0)

  return {
    stats: {
      total_projects: completedProjects.length,
      total_certificates: (certificatesResult.data || []).length,
      total_skills: (skillsResult.data || []).length,
      impact_score: totalHours
    }
  }
}
