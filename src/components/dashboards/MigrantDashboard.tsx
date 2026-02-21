import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createProject, getProjectsByCreator } from '../../services/projectService'
import { useUser } from '../../hooks/useUser'
import { supabase } from '../../services/supabaseClient'
import type { Project } from '../../types'

export default function MigrantDashboard() {
  const { userId } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [hoursTracked, setHoursTracked] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description_short: '',
    category_primary: '',
    location_municipality: '',
    max_participants: 10,
    skills_required: ''
  })

  const loadData = async () => {
    if (!userId) return
    try {
      const created = await getProjectsByCreator(userId)
      setProjects(created)

      if (created.length > 0) {
        const ids = created.map((p) => p.id)
        const { data } = await supabase
          .from('project_participants')
          .select('hours_completed')
          .in('project_id', ids)
          .in('status', ['accepted', 'completed'])

        const count = data?.length || 0
        const hours = (data || []).reduce((sum, item: any) => sum + Number(item.hours_completed || 0), 0)
        setParticipantCount(count)
        setHoursTracked(hours)
      } else {
        setParticipantCount(0)
        setHoursTracked(0)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Kunde inte ladda dashboarddata.')
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const stats = useMemo(
    () => ({
      projectsCreated: projects.length,
      activeVolunteers: participantCount,
      hoursTracked
    }),
    [projects.length, participantCount, hoursTracked]
  )

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!form.title.trim() || !form.category_primary.trim() || !form.location_municipality.trim()) {
      setError('Titel, kategori och kommun är obligatoriska.')
      return
    }

    setError('')
    setSaving(true)

    try {
      await createProject({
        ...form,
        created_by_id: userId,
        max_participants: Number(form.max_participants),
        skills_required: form.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
      })

      setForm({
        title: '',
        description_short: '',
        category_primary: '',
        location_municipality: '',
        max_participants: 10,
        skills_required: ''
      })

      await loadData()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Kunde inte skapa projekt.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="dashboard-layout">
      <div className="stats-grid">
        <article className="card"><h3>Projekt skapade</h3><p>{stats.projectsCreated}</p></article>
        <article className="card"><h3>Aktiva volontärer</h3><p>{stats.activeVolunteers}</p></article>
        <article className="card"><h3>Timmar registrerade</h3><p>{stats.hoursTracked}</p></article>
      </div>

      <form className="card form" onSubmit={handleCreate}>
        <h3>Skapa nytt socialt projekt</h3>
        <div className="form-row">
          <label>Titel *</label>
          <input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} required />
        </div>
        <div className="form-row">
          <label>Beskrivning</label>
          <textarea
            value={form.description_short}
            onChange={(e) => setForm((v) => ({ ...v, description_short: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label>Kategori *</label>
          <input value={form.category_primary} onChange={(e) => setForm((v) => ({ ...v, category_primary: e.target.value }))} required />
        </div>
        <div className="form-row">
          <label>Kommun *</label>
          <input value={form.location_municipality} onChange={(e) => setForm((v) => ({ ...v, location_municipality: e.target.value }))} required />
        </div>
        <div className="form-row">
          <label>Max deltagare</label>
          <input type="number" min={1} value={form.max_participants} onChange={(e) => setForm((v) => ({ ...v, max_participants: Number(e.target.value) }))} />
        </div>
        <div className="form-row">
          <label>Kompetenser (kommaseparerat)</label>
          <input value={form.skills_required} onChange={(e) => setForm((v) => ({ ...v, skills_required: e.target.value }))} />
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Sparar...' : 'Skapa projekt'}</button>
      </form>

      <section className="card">
        <h3>Mina projekt</h3>
        {projects.length === 0 && <p>Du har inte skapat några projekt ännu.</p>}
        {projects.map((project) => (
          <article key={project.id} className="list-item">
            <strong>{project.title}</strong>
            <span>{project.status}</span>
          </article>
        ))}
      </section>
    </section>
  )
}

