import { Navigate } from 'react-router-dom'
import MigrantDashboard from '../components/dashboards/MigrantDashboard'
import VolunteerDashboard from '../components/dashboards/VolunteerDashboard'
import MentorDashboard from '../components/dashboards/MentorDashboard'
import AdminDashboard from '../components/dashboards/AdminDashboard'
import { useUser } from '../hooks/useUser'

export default function Dashboard() {
  const { role, loading } = useUser()

  if (loading) return <p>Laddar dashboard...</p>
  if (!role) return <Navigate to="/login" replace />

  if (role === 'migrant') return <MigrantDashboard />
  if (role === 'volunteer') return <VolunteerDashboard />
  if (role === 'mentor') return <MentorDashboard />
  return <AdminDashboard />
}
