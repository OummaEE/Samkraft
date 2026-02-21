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

  return (
    <header className="header">
      <nav className="container nav">
        <Link to="/" className="brand">Samkraft</Link>

        <button className="menu-toggle" aria-label="Öppna meny" onClick={() => setOpen((v) => !v)}>
          Meny
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/projects" onClick={() => setOpen(false)}>Projekt</NavLink>
          {profile && <NavLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</NavLink>}
          {profile && <NavLink to="/my-projects" onClick={() => setOpen(false)}>Mina projekt</NavLink>}
          {profile && <NavLink to="/applications" onClick={() => setOpen(false)}>Ansökningar</NavLink>}
          {profile && <NavLink to="/profile/edit" onClick={() => setOpen(false)}>Profil</NavLink>}
          {!profile && <NavLink to="/login" onClick={() => setOpen(false)}>Logga in</NavLink>}
          {!profile && <NavLink to="/register" onClick={() => setOpen(false)}>Registrera</NavLink>}
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
