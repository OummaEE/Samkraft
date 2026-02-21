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

// Homepage
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="sv">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Samkraft - Dina kompetenser är värdefulla</title>
        <meta name="description" content="Bygg din portfolio genom verifierade volontärprojekt och skapa meningsfulla kopplingar genom Samkraft.">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body>
        <header class="site-header" id="home">
            <nav class="site-nav">
                <a href="#home" class="brand" data-scroll>
                    <i class="fas fa-handshake"></i>
                    <span>Samkraft</span>
                </a>

                <button type="button" id="mobile-menu-btn" class="menu-btn" aria-label="Öppna meny" aria-expanded="false">
                    <i class="fas fa-bars"></i>
                </button>

                <div id="nav-links" class="nav-links">
                    <a href="#home" data-scroll>Home</a>
                    <a href="#om-samkraft" data-scroll>Om Samkraft</a>
                    <a href="#signup" data-scroll>Gå med</a>
                    <a href="#kontakt" data-scroll>Kontakt</a>
                </div>
            </nav>
        </header>

        <main>
            <section class="hero section">
                <div class="container">
                    <h1>Dina kompetenser är värdefulla. Även utan personnummer.</h1>
                    <p class="hero-value">Bygg din portfolio genom verifierade volontärprojekt</p>
                    <p class="hero-copy">
                        Samkraft kopplar samman människor, mentorer och lokala initiativ för att skapa konkreta resultat och nya möjligheter.
                    </p>
                    <div class="hero-actions">
                        <button type="button" id="hero-scroll-btn" class="btn btn-secondary">Redo att börja?</button>
                        <button type="button" id="hero-join-btn" class="btn btn-primary">Gå med i hundratals personer</button>
                    </div>
                </div>
            </section>

            <section class="section section-soft" id="om-samkraft">
                <div class="container">
                    <h2>Om Samkraft</h2>
                    <div class="benefits-grid">
                        <article class="card">
                            <h3>Sociala kopplingar</h3>
                            <p>Sociala kopplingar - minskar isolering</p>
                        </article>
                        <article class="card">
                            <h3>Kompetensutveckling</h3>
                            <p>Kompetensutveckling - nya karriärmöjligheter</p>
                        </article>
                        <article class="card">
                            <h3>Positiv identitet</h3>
                            <p>Positiv identitet - känna sig värderad</p>
                        </article>
                        <article class="card">
                            <h3>Konstruktiva alternativ</h3>
                            <p>Konstruktiva alternativ - meningsfulla initiativ</p>
                        </article>
                    </div>
                </div>
            </section>

            <section class="section" id="how-it-works">
                <div class="container">
                    <h2>Så fungerar Samkraft</h2>
                    <ol class="steps-grid">
                        <li class="card">
                            <h3>1. Skapa en projektplattform</h3>
                            <p>Digital plattform för att föreslå projekt som stärker lokalsamhället.</p>
                        </li>
                        <li class="card">
                            <h3>2. Engagera volontärer och mentorer</h3>
                            <p>Svenska medborgare och mentorer bidrar med stöd och erfarenhet.</p>
                        </li>
                        <li class="card">
                            <h3>3. Genomföra projekt</h3>
                            <p>Godkända idéer realiseras tillsammans med deltagare och partners.</p>
                        </li>
                        <li class="card">
                            <h3>4. Utvärdering och spridning</h3>
                            <p>Resultat utvärderas och deltagare får intyg på sin insats.</p>
                        </li>
                    </ol>
                </div>
            </section>

            <section class="section section-soft cta-band">
                <div class="container">
                    <h2>Gå med i hundratals personer</h2>
                    <p>Starta med ett enkelt formulär och bli en del av nästa volontärprojekt.</p>
                    <button type="button" id="cta-join-btn" class="btn btn-primary">Gå med i hundratals personer</button>
                </div>
            </section>

            <section class="section" id="signup">
                <div class="container">
                    <div class="signup-card" id="signup-card">
                        <h2>Anmäl dig till Samkraft</h2>
                        <form id="signup-form" novalidate>
                            <div class="form-row">
                                <label for="full-name">Full name *</label>
                                <input type="text" id="full-name" name="fullName" required autocomplete="name">
                                <p id="full-name-error" class="form-error hidden">Full name är obligatoriskt.</p>
                            </div>

                            <div class="form-row">
                                <label for="email">Email *</label>
                                <input type="email" id="email" name="email" required autocomplete="email">
                                <p id="email-error" class="form-error hidden">Ange en giltig e-postadress.</p>
                            </div>

                            <div class="form-row">
                                <label for="role">Roll *</label>
                                <select id="role" name="role" required>
                                    <option value="">Välj roll</option>
                                    <option value="migrant">Jag är Migrant</option>
                                    <option value="mentor">Svenska Mentor</option>
                                    <option value="volontar">Volontär</option>
                                </select>
                                <p id="role-error" class="form-error hidden">Välj en roll.</p>
                            </div>

                            <div class="form-row">
                                <label for="motivation">Message/Motivation</label>
                                <textarea id="motivation" name="motivation" rows="4"></textarea>
                            </div>

                            <button type="submit" class="btn btn-primary submit-btn">Skicka anmälan</button>
                            <p id="form-success" class="form-success hidden">
                                Tack! Din anmälan är mottagen. Vi kontaktar dig snart.
                            </p>
                        </form>
                    </div>
                </div>
            </section>
        </main>

        <footer class="site-footer" id="kontakt">
            <div class="container footer-inner">
                <div>
                    <h3>Samkraft</h3>
                    <p>Bygg din portfolio genom verifierade volontärprojekt.</p>
                </div>
                <div>
                    <h4>Kontakt</h4>
                    <p><a href="mailto:kontakt@samkraft.se">kontakt@samkraft.se</a></p>
                    <p><a href="tel:+46000000000">+46 00 000 00 00</a></p>
                </div>
                <div>
                    <h4>Snabblänkar</h4>
                    <p><a href="#home" data-scroll>Home</a></p>
                    <p><a href="#om-samkraft" data-scroll>Om Samkraft</a></p>
                    <p><a href="#signup" data-scroll>Gå med</a></p>
                    <p><a href="#kontakt" data-scroll>Kontakt</a></p>
                </div>
            </div>
            <p class="copyright">© 2026 Samkraft</p>
        </footer>

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
                            <option value="environmental">MiljÃ¶</option>
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
                            SÃ¶k
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
                      LÃ¤s mer
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

