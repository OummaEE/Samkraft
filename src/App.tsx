import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Profile from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'
import MyProjects from './pages/MyProjects'
import Applications from './pages/Applications'
import ProjectPage from './pages/ProjectPage'
import NotFound from './pages/NotFound'
import { useAuth } from './hooks/useAuth'

function ProtectedRoute() {
  const { authUser, loading } = useAuth()

  if (loading) {
    return <main className="container section"><p>Laddar...</p></main>
  }

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="container section">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/profile/:username" element={<Profile />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/applications" element={<Applications />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
