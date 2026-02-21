import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createProject, getProjectsByCreator } from '../../services/projectService'
import { supabase } from '../../services/supabaseClient'
import { useUser } from '../../hooks/useUser'

export default function AdminDashboard() {
  const { userId, profile } = useUser()
  const [projects, setProjects] = useState<any[]>([])
  const [municipalityInfo, setMunicipalityInfo] = useState<any>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description_short: '',
    category_primary: 'social',
    max_participants: 15
  })

  const load = async () => {
    if (!profile?.municipality || !userId) return

    try {
      const [projectsData, municipalityRes] = await Promise.all([
        getProjectsByCreator(userId),
        supabase
          .from('municipalities')
          .select('*')
          .eq('name', profile.municipality)
          .maybeSingle()
      ])

      setMunicipalityInfo(municipalityRes.data || null)
      setProjects(projectsData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Kunde inte ladda admin-data.')
    }
  }

  useEffect(() => {
    load()
  }, [userId, profile?.municipality])

  const stats = useMemo(() => {
    const allocated = Number(municipalityInfo?.budget_allocated || 0)
    const spent = Number(municipalityInfo?.budget_spent || 0)
    return {
      allocated,
      spent,
      participants: projects.reduce(
        (sum: number, item: any) => sum + Number(item.current_participants || 0),
        0
      ),
      projects: projects.length
    }
  }, [municipalityInfo, projects])

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId || !profile?.municipality) return

    if (!form.title.trim()) {
      setError('Titel är obligatorisk.')
      return
    }

    try {
      setError('')
      await createProject({
        ...form,
        created_by_id: userId,
        location_municipality: profile.municipality,
        max_participants: Number(form.max_participants),
        skills_required: []
      })
      setForm({
        title: '',
        description_short: '',
        category_primary: 'social',
        max_participants: 15
      })
      await load()
    } catch (err: any) {
      setError(err.message || 'Kunde inte skapa projekt.')
    }
  }

  return (
    <section className="dashboard-layout">
      <div className="stats-grid">
        <article className="card">
          <h3>Budget allokerad</h3>
          <p>{stats.allocated}</p>
        </article>
        <article className="card">
          <h3>Budget spenderad</h3>
          <p>{stats.spent}</p>
        </article>
        <article className="card">
          <h3>Projekt i kommunen</h3>
          <p>{stats.projects}</p>
        </article>
        <article className="card">
          <h3>Deltagare</h3>
          <p>{stats.participants}</p>
        </article>
      </div>

      <form className="card form" onSubmit={onCreate}>
        <h3>Skapa kommunprojekt</h3>
        <div className="form-row">
          <label>Titel</label>
          <input
            value={form.title}
            onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
            required
          />
        </div>
        <div className="form-row">
          <label>Beskrivning</label>
          <textarea
            value={form.description_short}
            onChange={(e) =>
              setForm((v) => ({ ...v, description_short: e.target.value }))
            }
          />
        </div>
        <div className="form-row">
          <label>Kategori</label>
          <input
            value={form.category_primary}
            onChange={(e) =>
              setForm((v) => ({ ...v, category_primary: e.target.value }))
            }
          />
        </div>
        <div className="form-row">
          <label>Max deltagare</label>
          <input
            type="number"
            min={1}
            value={form.max_participants}
            onChange={(e) =>
              setForm((v) => ({
                ...v,
                max_participants: Number(e.target.value)
              }))
            }
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary">Skapa projekt</button>
      </form>

      <section className="card">
        <h3>Projekt att hantera</h3>
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
