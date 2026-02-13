import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { logger } from 'hono/logger'
import { createClient } from '@supabase/supabase-js'

// Define environment variables
type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

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

    const certs = certificates?.map(c => ({
      id: c.id,
      certificate_hash: c.certificate_hash,
      skills_validated: c.skills_validated,
      hours_contributed: c.hours_contributed,
      issued_at: c.issued_at,
      project_title: c.projects?.title
    })) || []

    const skills = skillsData?.map(s => ({
      name: s.skills?.name,
      category: s.skills?.category,
      proficiency: s.proficiency,
      validated_at: s.validated_at
    })) || []

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

    return c.json({ 
      success: true,
      valid: true,
      data: {
        id: certificate.id,
        certificate_hash: certificate.certificate_hash,
        first_name: certificate.users?.first_name,
        username: certificate.users?.username,
        project_title: certificate.projects?.title,
        skills_validated: certificate.skills_validated,
        hours_contributed: certificate.hours_contributed,
        outcome_description: certificate.outcome_description,
        issued_at: certificate.issued_at,
        mentor_first_name: certificate.mentors?.first_name,
        mentor_username: certificate.mentors?.username
      }
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to verify certificate' 
    }, 500)
  }
})

// Homepage (same as before)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="sv">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Samkraft - Din kompetens är värdefull</title>
        <meta name="description" content="Digital plattform för invandrare och lokalbefolkning i Sverige att bygga gemenskap genom verifierade volontärprojekt">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm">
            <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-handshake text-blue-600 text-2xl"></i>
                        <h1 class="text-2xl font-bold text-gray-900">Samkraft</h1>
                    </div>
                    <div class="hidden md:flex space-x-6">
                        <a href="#how-it-works" class="text-gray-600 hover:text-blue-600">Hur det fungerar</a>
                        <a href="#projects" class="text-gray-600 hover:text-blue-600">Projekt</a>
                        <a href="#about" class="text-gray-600 hover:text-blue-600">Om oss</a>
                        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Kom igång
                        </button>
                    </div>
                    <div class="md:hidden">
                        <button class="text-gray-600">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                    </div>
                </div>
            </nav>
        </header>

        <!-- Hero Section -->
        <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-4xl md:text-5xl font-bold mb-6">
                    Dina kompetenser är värdefulla.<br>
                    <span class="text-blue-200">Även utan personnummer.</span>
                </h2>
                <p class="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                    Bygg din portfolio genom verifierade volontärprojekt. 
                    Få officiella intyg. Skapa nätverk. Gör skillnad.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                        <i class="fas fa-user-plus mr-2"></i>
                        Registrera dig
                    </button>
                    <button class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
                        <i class="fas fa-play-circle mr-2"></i>
                        Se hur det fungerar
                    </button>
                </div>
            </div>
        </section>

        <!-- Value Propositions -->
        <section class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center">
                        <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-certificate text-blue-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Bygg din portfolio</h3>
                        <p class="text-gray-600">
                            Få verifierade bevis på dina kompetenser. 
                            Officiella intyg som arbetsgivare litar på.
                        </p>
                    </div>
                    
                    <div class="text-center">
                        <div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-users text-green-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Möt svenskar & mentorer</h3>
                        <p class="text-gray-600">
                            Skapa nätverk som håller. Arbeta tillsammans med erfarna 
                            mentorer och lokala invånare.
                        </p>
                    </div>
                    
                    <div class="text-center">
                        <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-heart text-purple-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Gör skillnad lokalt</h3>
                        <p class="text-gray-600">
                            Dina timmar räknas. Bidra till samhället och 
                            skapa mätbar påverkan i din kommun.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- How It Works -->
        <section id="how-it-works" class="py-16 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-3xl font-bold text-center mb-12">Hur det fungerar</h2>
                
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="relative">
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <div class="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                                1
                            </div>
                            <h3 class="text-xl font-semibold mb-3">Registrera dig</h3>
                            <p class="text-gray-600 mb-4">
                                Inget personnummer krävs. Registrera dig med e-post eller telefonnummer. 
                                Det tar bara 2 minuter.
                            </p>
                            <ul class="text-sm text-gray-600 space-y-2">
                                <li><i class="fas fa-check text-green-500 mr-2"></i>E-post eller telefon</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Välj språk (Svenska, engelska, arabiska, m.fl.)</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>GDPR-säkert</li>
                            </ul>
                        </div>
                        <div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                            <i class="fas fa-arrow-right text-blue-300 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="relative">
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <div class="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                                2
                            </div>
                            <h3 class="text-xl font-semibold mb-3">Hitta projekt</h3>
                            <p class="text-gray-600 mb-4">
                                Bläddra bland volontärprojekt i din kommun. 
                                Sök efter dina intressen och kompetenser.
                            </p>
                            <ul class="text-sm text-gray-600 space-y-2">
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Sociala projekt</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Utbildning & mentorskap</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Miljö & hållbarhet</li>
                            </ul>
                        </div>
                        <div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                            <i class="fas fa-arrow-right text-blue-300 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div>
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <div class="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                                3
                            </div>
                            <h3 class="text-xl font-semibold mb-3">Bygg din framtid</h3>
                            <p class="text-gray-600 mb-4">
                                Slutför projekt, samla intyg, få rekommendationsbrev. 
                                Bygg en portfolio som öppnar dörrar.
                            </p>
                            <ul class="text-sm text-gray-600 space-y-2">
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Verifierade certifikat</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Rekommendationsbrev</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i>Publik portfolio</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Featured Projects -->
        <section id="projects" class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-bold">Aktuella projekt</h2>
                    <a href="/projects" class="text-blue-600 hover:underline">
                        Se alla projekt <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
                
                <div id="projects-container" class="grid md:grid-cols-3 gap-6">
                    <!-- Projects will be loaded here via JavaScript -->
                    <div class="text-center py-8 col-span-3">
                        <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
                        <p class="text-gray-600">Laddar projekt...</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-16 bg-blue-600 text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-3xl font-bold mb-4">Redo att börja?</h2>
                <p class="text-xl mb-8 text-blue-100">
                    Gå med i hundratals personer som redan bygger sin framtid genom Samkraft
                </p>
                <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-lg">
                    Registrera dig gratis
                </button>
                <p class="mt-4 text-sm text-blue-200">
                    Inget personnummer krävs • Ingen kostnad • Starta direkt
                </p>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-gray-300 py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-8">
                    <div>
                        <div class="flex items-center space-x-2 mb-4">
                            <i class="fas fa-handshake text-blue-400 text-xl"></i>
                            <h3 class="text-white font-bold text-lg">Samkraft</h3>
                        </div>
                        <p class="text-sm">
                            Bygg gemenskap genom verifierade volontärprojekt
                        </p>
                        <p class="text-xs mt-2 text-gray-500">
                            Powered by Supabase PostgreSQL
                        </p>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold mb-4">För deltagare</h4>
                        <ul class="space-y-2 text-sm">
                            <li><a href="#" class="hover:text-white">Hitta projekt</a></li>
                            <li><a href="#" class="hover:text-white">Hur det fungerar</a></li>
                            <li><a href="#" class="hover:text-white">Skapa konto</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold mb-4">För kommuner</h4>
                        <ul class="space-y-2 text-sm">
                            <li><a href="#" class="hover:text-white">Bli partner</a></li>
                            <li><a href="#" class="hover:text-white">Se påverkan</a></li>
                            <li><a href="#" class="hover:text-white">Kontakta oss</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-white font-semibold mb-4">Språk / Language</h4>
                        <ul class="space-y-2 text-sm">
                            <li><a href="#" class="text-white font-semibold">🇸🇪 Svenska</a></li>
                            <li><a href="#" class="hover:text-white">🇬🇧 English</a></li>
                            <li><a href="#" class="hover:text-white">🇸🇦 العربية</a></li>
                            <li><a href="#" class="hover:text-white">🇺🇦 Українська</a></li>
                        </ul>
                    </div>
                </div>
                
                <div class="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p class="text-sm">© 2026 Samkraft. Alla rättigheter förbehållna.</p>
                    <div class="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" class="text-sm hover:text-white">Integritetspolicy</a>
                        <a href="#" class="text-sm hover:text-white">Användarvillkor</a>
                        <a href="#" class="text-sm hover:text-white">Kontakt</a>
                    </div>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

// Projects page (same structure as before)
app.get('/projects', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="sv">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Projekt - Samkraft</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <header class="bg-white shadow-sm">
            <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex justify-between items-center">
                    <a href="/" class="flex items-center space-x-2">
                        <i class="fas fa-handshake text-blue-600 text-2xl"></i>
                        <h1 class="text-2xl font-bold text-gray-900">Samkraft</h1>
                    </a>
                    <div class="flex space-x-4">
                        <a href="/" class="text-gray-600 hover:text-blue-600">Hem</a>
                        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Logga in
                        </button>
                    </div>
                </div>
            </nav>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 class="text-3xl font-bold mb-8">Hitta projekt</h1>
            
            <!-- Filters -->
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="grid md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                        <select id="filter-category" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="">Alla kategorier</option>
                            <option value="social">Socialt</option>
                            <option value="education">Utbildning</option>
                            <option value="environmental">Miljö</option>
                            <option value="technology">Teknik</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kommun</label>
                        <select id="filter-municipality" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="">Alla kommuner</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Typ</label>
                        <select id="filter-type" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="">Alla typer</option>
                            <option value="physical">Fysiskt</option>
                            <option value="digital">Digitalt</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>
                    
                    <div class="flex items-end">
                        <button id="apply-filters" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            <i class="fas fa-search mr-2"></i>
                            Sök
                        </button>
                    </div>
                </div>
            </div>

            <!-- Projects Grid -->
            <div id="projects-grid" class="grid md:grid-cols-3 gap-6">
                <div class="text-center py-8 col-span-3">
                    <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
                    <p class="text-gray-600">Laddar projekt...</p>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          async function loadProjects() {
            const category = document.getElementById('filter-category').value
            const municipality = document.getElementById('filter-municipality').value
            
            let url = '/api/projects?status=active'
            if (category) url += '&category=' + category
            if (municipality) url += '&municipality=' + municipality
            
            try {
              const response = await axios.get(url)
              const projects = response.data.data
              
              const grid = document.getElementById('projects-grid')
              
              if (projects.length === 0) {
                grid.innerHTML = '<div class="col-span-3 text-center py-8"><p class="text-gray-600">Inga projekt hittades</p></div>'
                return
              }
              
              grid.innerHTML = projects.map(project => \`
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">\${project.title}</h3>
                    <p class="text-gray-600 text-sm mb-4">\${project.description_short || project.description_long?.substring(0, 100) + '...' || 'Ingen beskrivning'}</p>
                    <div class="flex items-center text-sm text-gray-500 mb-2">
                      <i class="fas fa-map-marker-alt mr-2"></i>
                      <span>\${project.location_municipality || 'Ej angivet'}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500 mb-4">
                      <i class="fas fa-users mr-2"></i>
                      <span>\${project.current_participants || 0} / \${project.max_participants || 0} deltagare</span>
                    </div>
                    <button class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Läs mer
                    </button>
                  </div>
                </div>
              \`).join('')
            } catch (error) {
              console.error('Error loading projects:', error)
              grid.innerHTML = '<div class="col-span-3 text-center py-8"><p class="text-red-600">Fel vid laddning av projekt</p></div>'
            }
          }
          
          async function loadMunicipalities() {
            try {
              const response = await axios.get('/api/municipalities')
              const select = document.getElementById('filter-municipality')
              
              response.data.data.forEach(muni => {
                const option = document.createElement('option')
                option.value = muni.name
                option.textContent = muni.name
                select.appendChild(option)
              })
            } catch (error) {
              console.error('Error loading municipalities:', error)
            }
          }
          
          document.getElementById('apply-filters').addEventListener('click', loadProjects)
          
          loadMunicipalities()
          loadProjects()
        </script>
    </body>
    </html>
  `)
})

export default app
