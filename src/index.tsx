import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { logger } from 'hono/logger'

// Define Cloudflare bindings
type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Samkraft API'
  })
})

// Get all projects (with filters)
app.get('/api/projects', async (c) => {
  const { env } = c
  const category = c.req.query('category')
  const municipality = c.req.query('municipality')
  const status = c.req.query('status') || 'active'

  try {
    let query = 'SELECT * FROM projects WHERE status = ?'
    const params: any[] = [status]

    if (category) {
      query += ' AND category_primary = ?'
      params.push(category)
    }

    if (municipality) {
      query += ' AND location_municipality = ?'
      params.push(municipality)
    }

    query += ' ORDER BY created_at DESC LIMIT 50'

    const result = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({ 
      success: true, 
      data: result.results,
      count: result.results.length 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch projects' 
    }, 500)
  }
})

// Get single project by ID
app.get('/api/projects/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')

  try {
    const project = await env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    ).bind(id).first()

    if (!project) {
      return c.json({ 
        success: false, 
        error: 'Project not found' 
      }, 404)
    }

    // Get project roles
    const roles = await env.DB.prepare(
      'SELECT * FROM project_roles WHERE project_id = ?'
    ).bind(id).all()

    return c.json({ 
      success: true, 
      data: {
        ...project,
        roles: roles.results
      }
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch project' 
    }, 500)
  }
})

// Get municipalities
app.get('/api/municipalities', async (c) => {
  const { env } = c

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM municipalities WHERE active = 1 ORDER BY name'
    ).all()

    return c.json({ 
      success: true, 
      data: result.results 
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
  const { env } = c
  const category = c.req.query('category')

  try {
    let query = 'SELECT * FROM skills'
    const params: any[] = []

    if (category) {
      query += ' WHERE category = ?'
      params.push(category)
    }

    query += ' ORDER BY name'

    const result = await env.DB.prepare(query).bind(...params).all()

    return c.json({ 
      success: true, 
      data: result.results 
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
  const { env } = c
  const username = c.req.param('username')

  try {
    // Get user info
    const user = await env.DB.prepare(
      `SELECT id, username, first_name, profile_photo_url, bio, 
              location_municipality, impact_score, tier, created_at, languages
       FROM users 
       WHERE username = ? AND profile_visibility = 'public' AND deleted_at IS NULL`
    ).bind(username).first()

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found or profile is private' 
      }, 404)
    }

    // Get completed projects
    const projects = await env.DB.prepare(
      `SELECT p.*, pp.hours_logged, pp.rating_by_creator, pp.completed_at
       FROM project_participants pp
       JOIN projects p ON pp.project_id = p.id
       WHERE pp.user_id = ? AND pp.status = 'completed'
       ORDER BY pp.completed_at DESC`
    ).bind(user.id).all()

    // Get certificates
    const certificates = await env.DB.prepare(
      `SELECT c.*, p.title as project_title
       FROM certificates c
       JOIN projects p ON c.project_id = p.id
       WHERE c.user_id = ? AND c.revoked_at IS NULL
       ORDER BY c.issued_at DESC`
    ).bind(user.id).all()

    // Get skills
    const skills = await env.DB.prepare(
      `SELECT s.name, s.category, us.proficiency, us.validated_at
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = ?
       ORDER BY s.category, s.name`
    ).bind(user.id).all()

    return c.json({ 
      success: true, 
      data: {
        user,
        projects: projects.results,
        certificates: certificates.results,
        skills: skills.results,
        stats: {
          total_projects: projects.results.length,
          total_certificates: certificates.results.length,
          total_skills: skills.results.length,
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
  const { env } = c
  const hash = c.req.param('hash')

  try {
    const certificate = await env.DB.prepare(
      `SELECT c.*, u.first_name, u.username, p.title as project_title,
              m.first_name as mentor_first_name, m.username as mentor_username
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN projects p ON c.project_id = p.id
       JOIN users m ON c.mentor_id = m.id
       WHERE c.certificate_hash = ? AND c.revoked_at IS NULL`
    ).bind(hash).first()

    if (!certificate) {
      return c.json({ 
        success: false, 
        error: 'Certificate not found or has been revoked',
        valid: false
      }, 404)
    }

    return c.json({ 
      success: true,
      valid: true,
      data: certificate
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

// Projects page
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
