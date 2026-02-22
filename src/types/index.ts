export type UserRole = 'migrant' | 'volunteer' | 'mentor' | 'municipality_admin' | 'pending_admin'

export type ProjectStatus = 'draft' | 'pending_review' | 'in_development' | 'active' | 'completed' | 'archived'

export const PROJECT_CATEGORIES = [
  { value: 'social', label: 'Social' },
  { value: 'environmental', label: 'Miljö' },
  { value: 'education', label: 'Utbildning' },
  { value: 'culture', label: 'Kultur' },
  { value: 'health', label: 'Hälsa' },
  { value: 'technology', label: 'Teknik' },
  { value: 'sports', label: 'Sport & Fritid' },
  { value: 'other', label: 'Övrigt' },
] as const

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Utkast',
  pending_review: 'Väntar på godkännande',
  in_development: 'Under utveckling',
  active: 'Pågående',
  completed: 'Avslutat',
  archived: 'Arkiverat',
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  municipality: string | null
  bio: string | null
  avatar_url: string | null
  username: string | null
  created_at: string
}

export interface Municipality {
  id: string
  name: string
  budget_allocated: number | null
  budget_spent: number | null
  active?: boolean
}

export interface Skill {
  id: string
  name: string
  category: string | null
}

export interface UserSkill {
  id?: string
  user_id: string
  skill_id: string
  proficiency_level: number
  skills?: Skill
}

export interface Project {
  id: string
  title: string
  description_short: string | null
  category_primary: string | null
  status: ProjectStatus
  max_participants: number | null
  created_by_id: string
  location_municipality: string | null
  created_at?: string
  current_participants?: number
  skills_required?: string[]
  matchScore?: number
  budget_cost?: number
  budget_spent?: number
  website_url?: string | null
  attachment_url?: string | null
  attachment_name?: string | null
  result_summary?: string | null
  result_photos?: string[]
  completed_at?: string | null
}

export interface ProjectParticipant {
  id?: string
  project_id: string
  user_id: string
  role: string
  hours_completed: number
  status: 'pending' | 'accepted' | 'completed' | 'rejected'
  created_at?: string
}

export interface VolunteerHour {
  id?: string
  project_id: string
  user_id: string
  hours: number
  description?: string
  logged_at: string
  created_at?: string
  users?: { full_name: string; email: string }
}

export interface Certificate {
  id: string
  user_id: string
  project_id: string
  title: string
  issued_date: string
  certificate_url: string | null
}

export interface Recommendation {
  id: string
  from_user_id: string
  to_user_id: string
  project_id: string
  content: string
  created_at?: string
}

export interface RegisterInput {
  email: string
  password: string
  fullName: string
  role: UserRole
  municipality?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface ProjectFilters {
  municipality?: string
  category?: string
  status?: string
  skills?: string[]
  sortBy?: 'best_match' | 'newest' | 'popular'
}

export interface DashboardStats {
  projectsCreated?: number
  activeVolunteers?: number
  hoursTracked?: number
  completedHours?: number
  certificatesEarned?: number
  skillsMatched?: number
  managedProjects?: number
  municipalityBudgetAllocated?: number
  municipalityBudgetSpent?: number
}