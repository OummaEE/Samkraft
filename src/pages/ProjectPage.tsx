import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProjectDetail from '../components/projects/ProjectDetail'
import { applyToProject, getProjectById } from '../services/projectService'
import { useUser } from '../hooks/useUser'
import type { Project } from '../types'

export default function ProjectPage() {
  const { id } = useParams()
  const { userId, profile } = useUser()
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const data = await getProjectById(id)
      setProject(data)
    }
    load().catch((err) => setError(err.message || 'Kunde inte ladda projekt.'))
  }, [id])

  const onApply = async () => {
    if (!project || !userId) return

    try {
      await applyToProject({
        project_id: project.id,
        user_id: userId,
        role: profile?.role || 'volunteer',
        hours_completed: 0,
        status: 'pending'
      })
      setMessage('Ansökan skickad.')
      setError('')
    } catch (err: any) {
      setError(err.message || 'Kunde inte ansöka.')
    }
  }

  if (!project) return <p>Laddar projekt...</p>

  return (
    <section>
      <ProjectDetail project={project} onApply={onApply} canApply={!!userId} />
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </section>
  )
}
