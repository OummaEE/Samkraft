import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const close = () => setOpen(false)

  return (
    <header className="header">
      <nav className="container nav">
        <Link to="/" className="brand">
          Samkraft
        </Link>

        <button
          className="menu-toggle"
          aria-label="Öppna meny"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" onClick={close}>Hem</NavLink>
          <NavLink to="/projects" onClick={close}>Projekt</NavLink>
          {profile && <NavLink to="/dashboard" onClick={close}>Dashboard</NavLink>}
          {profile && <NavLink to="/my-projects" onClick={close}>Mina projekt</NavLink>}
          {profile && <NavLink to="/applications" onClick={close}>Ansökningar</NavLink>}
          {profile && <NavLink to="/profile/edit" onClick={close}>Profil</NavLink>}
          {!profile && <NavLink to="/login" onClick={close}>Logga in</NavLink>}
          {!profile && (
            <Link to="/register" className="btn btn-primary" onClick={close}>
              Registrera
            </Link>
          )}
          {profile && (
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Logga ut
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}