import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createClient } from '@supabase/supabase-js'

// Define environment variables
type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors())

// Helper function to create Supabase client
function getSupabaseClient(c: any) {
  const supabaseUrl = c.env.SUPABASE_URL
  const supabaseKey = c.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// API Routes

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Samkraft API',
    database: 'Supabase PostgreSQL'
  })
})

// Get all projects (with filters)
app.get('/api/projects', async (c) => {
  try {
    const supabase = getSupabaseClient(c)
    const category = c.req.query('category')
    const municipality = c.req.query('municipality')
    const status = c.req.query('status') || 'active'

    let query = supabase
      .from('projects')
      .select('*')
      .eq('status', status)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(50)

    if (category) {
      query = query.eq('category_primary', category)
    }

    if (municipality) {
      query = query.eq('location_municipality', municipality)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to fetch projects' 
      }, 500)
    }
    
    return c.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Error:', error)
    return c.json({ 
      success: false, 
      error: 'Database connection failed. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.' 
    }, 500)
  }
})

// Get single project by ID
app.get('/api/projects/:id', async (c) => {
  try {
    const supabase = getSupabaseClient(c)
    const id = c.req.param('id')

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      return c.json({ 
        success: false, 
        error: 'Project not found' 
      }, 404)
    }

    // Get project roles
    const { data: roles, error: rolesError } = await supabase
      .from('project_roles')
      .select('*')
      .eq('project_id', id)

    return c.json({ 
      success: true, 
      data: {
        ...project,
        roles: roles || []
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch project' 
    }, 500)
  }
})

// Get municipalities
app.get('/api/municipalities', async (c) => {
  try {
    const supabase = getSupabaseClient(c)

    const { data, error } = await supabase
      .from('municipalities')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) {
      return c.json({ 
        success: false, 
        error: 'Failed to fetch municipalities' 
      }, 500)
    }

    return c.json({ 
      success: true, 
      data: data || [] 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch municipalities' 
    }, 500)
  }
})

// Get skills
app.get('/api/skills', async (c) => {
  try {
    const supabase = getSupabaseClient(c)
    const category = c.req.query('category')

    let query = supabase
      .from('skills')
      .select('*')
      .order('name')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return c.json({ 
        success: false, 
        error: 'Failed to fetch skills' 
      }, 500)
    }

    return c.json({ 
      success: true, 
      data: data || [] 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch skills' 
    }, 500)
  }
})

// Get user portfolio (public)
app.get('/api/users/:username/portfolio', async (c) => {
  try {
    const supabase = getSupabaseClient(c)
    const username = c.req.param('username')

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, first_name, profile_photo_url, bio, location_municipality, impact_score, tier, created_at, languages')
      .eq('username', username)
      .eq('profile_visibility', 'public')
      .is('deleted_at', null)
      .single()

    if (userError || !user) {
      return c.json({ 
        success: false, 
        error: 'User not found or profile is private' 
      }, 404)
    }

    // Get completed projects
    const { data: participations, error: participationsError } = await supabase
      .from('project_participants')
      .select(`
        hours_logged,
        rating_by_creator,
        completed_at,
        projects (
          id,
          title,
          category_primary,
          location_municipality
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    // Get certificates
    const { data: certificates, error: certsError } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_hash,
        skills_validated,
        hours_contributed,
        issued_at,
        projects (
          title
        )
      `)
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('issued_at', { ascending: false })

    // Get skills
    const { data: skillsData, error: skillsError } = await supabase
      .from('user_skills')
      .select(`
        proficiency,
        validated_at,
        skills (
          name,
          category
        )
      `)
      .eq('user_id', user.id)
      .order('skills(category)')

    const projects = participations?.map(p => ({
      ...p.projects,
      hours_logged: p.hours_logged,
      rating_by_creator: p.rating_by_creator,
      completed_at: p.completed_at
    })) || []

    const certs = certificates?.map(c => {
      const projectData: any = Array.isArray(c.projects) ? c.projects[0] : c.projects
      return {
        id: c.id,
        certificate_hash: c.certificate_hash,
        skills_validated: c.skills_validated,
        hours_contributed: c.hours_contributed,
        issued_at: c.issued_at,
        project_title: projectData?.title
      }
    }) || []

    const skills = skillsData?.map(s => {
      const skillData: any = Array.isArray(s.skills) ? s.skills[0] : s.skills
      return {
        name: skillData?.name,
        category: skillData?.category,
        proficiency: s.proficiency,
        validated_at: s.validated_at
      }
    }) || []

    return c.json({ 
      success: true, 
      data: {
        user,
        projects,
        certificates: certs,
        skills,
        stats: {
          total_projects: projects.length,
          total_certificates: certs.length,
          total_skills: skills.length,
          impact_score: user.impact_score
        }
      }
    })
  } catch (error) {
    console.error('Portfolio fetch error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch portfolio' 
    }, 500)
  }
})

// Verify certificate
app.get('/api/certificates/verify/:hash', async (c) => {
  try {
    const supabase = getSupabaseClient(c)
    const hash = c.req.param('hash')

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_hash,
        skills_validated,
        hours_contributed,
        outcome_description,
        issued_at,
        users!user_id (
          first_name,
          username
        ),
        projects (
          title
        ),
        mentors:users!mentor_id (
          first_name,
          username
        )
      `)
      .eq('certificate_hash', hash)
      .is('revoked_at', null)
      .single()

    if (error || !certificate) {
      return c.json({ 
        success: false, 
        error: 'Certificate not found or has been revoked',
        valid: false
      }, 404)
    }

    const certificateUser = Array.isArray(certificate.users) ? certificate.users[0] : certificate.users
    const certificateProject = Array.isArray(certificate.projects) ? certificate.projects[0] : certificate.projects
    const certificateMentor = Array.isArray(certificate.mentors) ? certificate.mentors[0] : certificate.mentors

    return c.json({ 
      success: true,
      valid: true,
      data: {
        id: certificate.id,
        certificate_hash: certificate.certificate_hash,
        first_name: certificateUser?.first_name,
        username: certificateUser?.username,
        project_title: certificateProject?.title,
        skills_validated: certificate.skills_validated,
        hours_contributed: certificate.hours_contributed,
        outcome_description: certificate.outcome_description,
        issued_at: certificate.issued_at,
        mentor_first_name: certificateMentor?.first_name,
        mentor_username: certificateMentor?.username
      }
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to verify certificate' 
    }, 500)
  }
})

// SPA fallback for any frontend route that is not an API endpoint.
app.get('*', async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.notFound()
  }

  const assetResponse = await c.env.ASSETS.fetch(c.req.raw)
  if (assetResponse.status !== 404) {
    return assetResponse
  }

  const indexRequest = new Request(new URL('/index.html', c.req.url).toString(), c.req.raw)
  return c.env.ASSETS.fetch(indexRequest)
})
export default app





