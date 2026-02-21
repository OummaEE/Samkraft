function scrollToTarget(selector) {
  const element = document.querySelector(selector)
  if (!element) return
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function setFieldState(input, errorNode, message) {
  if (message) {
    input.classList.add('invalid')
    errorNode.textContent = message
    errorNode.classList.remove('hidden')
    return false
  }

  input.classList.remove('invalid')
  errorNode.classList.add('hidden')
  return true
}

function openSignupForm() {
  const card = document.getElementById('signup-card')
  scrollToTarget('#signup')
  if (card) {
    card.classList.remove('flash')
    window.setTimeout(() => card.classList.add('flash'), 30)
  }

  const fullNameInput = document.getElementById('full-name')
  if (fullNameInput) {
    window.setTimeout(() => fullNameInput.focus(), 350)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('mobile-menu-btn')
  const navLinks = document.getElementById('nav-links')

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true'
      menuBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true')
      navLinks.classList.toggle('open')
    })
  }

  document.querySelectorAll('[data-scroll]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href')
      if (!href || !href.startsWith('#')) return

      event.preventDefault()
      if (navLinks) navLinks.classList.remove('open')
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false')
      scrollToTarget(href)
    })
  })

  const heroScrollBtn = document.getElementById('hero-scroll-btn')
  const heroJoinBtn = document.getElementById('hero-join-btn')
  const ctaJoinBtn = document.getElementById('cta-join-btn')

  if (heroScrollBtn) {
    heroScrollBtn.addEventListener('click', () => {
      scrollToTarget('#signup')
    })
  }

  if (heroJoinBtn) {
    heroJoinBtn.addEventListener('click', openSignupForm)
  }

  if (ctaJoinBtn) {
    ctaJoinBtn.addEventListener('click', openSignupForm)
  }

  const signupForm = document.getElementById('signup-form')
  if (!signupForm) return

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const fullNameInput = document.getElementById('full-name')
    const emailInput = document.getElementById('email')
    const roleInput = document.getElementById('role')

    const nameError = document.getElementById('full-name-error')
    const emailError = document.getElementById('email-error')
    const roleError = document.getElementById('role-error')
    const successNode = document.getElementById('form-success')

    if (!fullNameInput || !emailInput || !roleInput || !nameError || !emailError || !roleError || !successNode) {
      return
    }

    const fullName = fullNameInput.value.trim()
    const email = emailInput.value.trim()
    const role = roleInput.value.trim()

    const validName = setFieldState(fullNameInput, nameError, fullName ? '' : 'Full name är obligatoriskt.')

    let emailMessage = ''
    if (!email) {
      emailMessage = 'Email är obligatoriskt.'
    } else if (!validateEmail(email)) {
      emailMessage = 'Ange en giltig e-postadress.'
    }
    const validEmail = setFieldState(emailInput, emailError, emailMessage)

    const validRole = setFieldState(roleInput, roleError, role ? '' : 'Välj en roll.')

    if (!validName || !validEmail || !validRole) {
      successNode.classList.add('hidden')
      return
    }

    successNode.classList.remove('hidden')
    signupForm.reset()
    ;[fullNameInput, emailInput, roleInput].forEach((field) => field.classList.remove('invalid'))
  })
})
