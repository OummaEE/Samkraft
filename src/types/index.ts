export type UserRole = 'migrant' | 'volunteer' | 'mentor' | 'municipality_admin'

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
active?: boolean   // <-- добавь это
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
  status: string
  max_participants: number | null
  created_by_id: string
  location_municipality: string | null
  created_at?: string
  current_participants?: number
  skills_required?: string[]
  matchScore?: number
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
