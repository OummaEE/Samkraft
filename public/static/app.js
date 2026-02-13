/**
 * Samkraft Frontend Application
 * Main JavaScript file for homepage and project interactions
 */

// Load featured projects on homepage
async function loadFeaturedProjects() {
  const container = document.getElementById('projects-container')
  if (!container) return

  try {
    const response = await axios.get('/api/projects?status=active')
    const projects = response.data.data.slice(0, 3) // Get first 3 projects

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="col-span-3 text-center py-8">
          <i class="fas fa-info-circle text-3xl text-gray-400 mb-4"></i>
          <p class="text-gray-600">Inga aktiva projekt just nu. Kom tillbaka snart!</p>
        </div>
      `
      return
    }

    container.innerHTML = projects.map(project => `
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition card-hover">
        <div class="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <i class="fas fa-project-diagram text-white text-6xl opacity-50"></i>
        </div>
        <div class="p-6">
          <div class="flex items-center mb-2">
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              ${getCategoryLabel(project.category_primary)}
            </span>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-900">${escapeHtml(project.title)}</h3>
          <p class="text-gray-600 text-sm mb-4 line-clamp-2">
            ${escapeHtml(project.description_short || project.description_long?.substring(0, 120) + '...' || 'Ingen beskrivning')}
          </p>
          
          <div class="space-y-2 mb-4">
            <div class="flex items-center text-sm text-gray-500">
              <i class="fas fa-map-marker-alt w-5"></i>
              <span>${escapeHtml(project.location_municipality || 'Ej angivet')}</span>
            </div>
            <div class="flex items-center text-sm text-gray-500">
              <i class="fas fa-users w-5"></i>
              <span>${project.current_participants || 0} / ${project.max_participants || 0} deltagare</span>
            </div>
            <div class="flex items-center text-sm text-gray-500">
              <i class="fas fa-clock w-5"></i>
              <span>${project.weekly_commitment || 'Flexibel tid'}</span>
            </div>
          </div>
          
          <button class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-arrow-right mr-2"></i>
            Läs mer & ansök
          </button>
        </div>
      </div>
    `).join('')

  } catch (error) {
    console.error('Error loading projects:', error)
    container.innerHTML = `
      <div class="col-span-3 text-center py-8">
        <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
        <p class="text-red-600">Kunde inte ladda projekt. Försök igen senare.</p>
      </div>
    `
  }
}

// Get category label in Swedish
function getCategoryLabel(category) {
  const labels = {
    'social': 'Socialt',
    'education': 'Utbildning',
    'environmental': 'Miljö',
    'technology': 'Teknik',
    'health': 'Hälsa',
    'culture': 'Kultur',
    'sports': 'Idrott'
  }
  return labels[category] || category || 'Övrigt'
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Smooth scroll to section
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Load featured projects if container exists
  if (document.getElementById('projects-container')) {
    loadFeaturedProjects()
  }

  // Add smooth scroll to anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href')
      if (href !== '#') {
        e.preventDefault()
        scrollToSection(href.substring(1))
      }
    })
  })

  // Mobile menu toggle (if needed)
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn')
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      // Toggle mobile menu
      console.log('Mobile menu clicked')
    })
  }
})

// Utility: Format date to Swedish locale
function formatDate(dateString) {
  if (!dateString) return 'Ej angivet'
  const date = new Date(dateString)
  return date.toLocaleDateString('sv-SE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Utility: Calculate days until date
function daysUntil(dateString) {
  if (!dateString) return null
  const targetDate = new Date(dateString)
  const today = new Date()
  const diffTime = targetDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Show notification (toast)
function showNotification(message, type = 'info') {
  const notification = document.createElement('div')
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  }`
  notification.textContent = message
  
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.style.opacity = '0'
    notification.style.transition = 'opacity 0.5s'
    setTimeout(() => notification.remove(), 500)
  }, 3000)
}

// Export functions for use in other scripts
window.Samkraft = {
  loadFeaturedProjects,
  getCategoryLabel,
  escapeHtml,
  scrollToSection,
  formatDate,
  daysUntil,
  showNotification
}
