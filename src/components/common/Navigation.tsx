import { NavLink } from 'react-router-dom'

export default function Navigation() {
  return (
    <aside className="side-nav card">
      <h3>Snabbnavigering</h3>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/projects">Projekt</NavLink>
      <NavLink to="/my-projects">Mina projekt</NavLink>
      <NavLink to="/applications">Ansökningar</NavLink>
      <NavLink to="/profile/edit">Redigera profil</NavLink>
    </aside>
  )
}
