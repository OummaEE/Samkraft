import { useEffect, useState, type FormEvent } from 'react'
import { listProjectsFromApi } from '../../services/projectService'
import { supabase } from '../../services/supabaseClient'
import { useUser } from '../../hooks/useUser'
import type { Project } from '../../types'

export default function MentorDashboard() {
  const { userId } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [toUserId, setToUserId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setProjects(await listProjectsFromApi())
      } catch (err: any) {
        setError(err.message || 'Kunde inte ladda projekt.')
      }
    }
    load()
  }, [])

  const submitRecommendation = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!toUserId.trim() || !projectId.trim() || !content.trim()) {
      setError('Mottagare, projekt och innehåll är obligatoriskt.')
      return
    }

    try {
      const { error: insertError } = await supabase.from('recommendations').insert({
        from_user_id: userId,
        to_user_id: toUserId,
        project_id: projectId,
        content,
        created_at: new Date().toISOString()
      })
      if (insertError) throw insertError

      setMessage('Rekommendation skickad.')
      setError('')
      setToUserId('')
      setProjectId('')
      setContent('')
    } catch (err: any) {
      setMessage('')
      setError(err.message || 'Kunde inte skicka rekommendation.')
    }
  }

  return (
    <section className="dashboard-layout">
      <section className="card">
        <h3>Projekt i nätverket</h3>
        {projects.map((project) => (
          <article className="list-item" key={project.id}>
            <strong>{project.title}</strong>
            <span>{project.location_municipality}</span>
          </article>
        ))}
      </section>

      <form className="card form" onSubmit={submitRecommendation}>
        <h3>Ge rekommendation</h3>
        <div className="form-row">
          <label htmlFor="to-user-id">Volontär användar-ID</label>
          <input id="to-user-id" value={toUserId} onChange={(e) => setToUserId(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="project-id">Projekt</label>
          <select id="project-id" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            <option value="">Välj projekt</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="recommendation">Innehåll</label>
          <textarea id="recommendation" value={content} onChange={(e) => setContent(e.target.value)} required />
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button className="btn btn-primary">Skicka rekommendation</button>
      </form>
    </section>
  )
}

