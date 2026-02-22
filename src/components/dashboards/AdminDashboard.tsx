import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from 'react'
import {
  createProject,
  getProjectsByCreator,
  updateProjectStatus,
  updateProjectBudgetSpent,
  updateProjectResults,
  uploadProjectFile,
  getVolunteerHoursForProject,
} from '../../services/projectService'
import { supabase } from '../../services/supabaseClient'
import { useUser } from '../../hooks/useUser'
import type { Project, ProjectStatus, VolunteerHour } from '../../types'
import { PROJECT_CATEGORIES, PROJECT_STATUS_LABELS } from '../../types'

export default function AdminDashboard() {
  const { userId, profile } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [municipalityInfo, setMunicipalityInfo] = useState<any>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Project form
  const [form, setForm] = useState({
    title: '',
    description_short: '',
    category_primary: 'social',
    max_participants: 15,
    budget_cost: '',
    website_url: '',
  })

  // Expand panels
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [hoursMap, setHoursMap] = useState<Record<string, VolunteerHour[]>>({})
  const [budgetSpentInput, setBudgetSpentInput] = useState<Record<string, string>>({})
  const [resultSummary, setResultSummary] = useState('')
  const [resultPhotos, setResultPhotos] = useState<File[]>([])

  const load = async () => {
    if (!profile?.municipality || !userId) return
    try {
      const [projectsData, municipalityRes] = await Promise.all([
        getProjectsByCreator(userId),
        supabase.from('municipalities').select('*').eq('name', profile.municipality).maybeSingle(),
      ])
      setMunicipalityInfo(municipalityRes.data || null)
      setProjects(projectsData)
    } catch (err: any) {
      setError(err.message || 'Kunde inte ladda admin-data.')
    }
  }

  useEffect(() => { load() }, [userId, profile?.municipality])

  const stats = useMemo(() => ({
    allocated: Number(municipalityInfo?.budget_allocated || 0),
    spent: Number(municipalityInfo?.budget_spent || 0),
    participants: projects.reduce((sum, p) => sum + Number(p.current_participants || 0), 0),
    projects: projects.length,
  }), [municipalityInfo, projects])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.split('.').pop()?.toLowerCase()
    const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp']
    if (!ext || !allowed.includes(ext)) {
      setError('Endast PDF och bilder (JPG, PNG, GIF, WebP) är tillåtna.')
      e.target.value = ''
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Filen får inte vara större än 10 MB.')
      e.target.value = ''
      return
    }
    setFile(f)
    setError('')
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId || !profile?.municipality) return
    if (!form.title.trim()) { setError('Titel är obligatorisk.'); return }

    setError('')
    setUploading(true)
    try {
      let attachmentUrl: string | undefined
      let attachmentName: string | undefined

      // Сначала создаём проект (нам нужен ID для upload)
      // municipality_admin создаёт сразу в 'active'
      const projectId = crypto.randomUUID()

      if (file) {
        attachmentUrl = await uploadProjectFile(file, projectId)
        attachmentName = file.name
      }

      await supabase.from('projects').insert({
        id: projectId,
        title: form.title.trim(),
        description_short: form.description_short.trim() || null,
        category_primary: form.category_primary,
        max_participants: Number(form.max_participants) || 15,
        budget_cost: form.budget_cost ? Number(form.budget_cost) : 0,
        website_url: form.website_url.trim() || null,
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
        created_by_id: userId,
        creator_id: userId,
        location_municipality: profile.municipality,
        status: 'active',
        skills_required: [],
        created_at: new Date().toISOString(),
      })

      setForm({ title: '', description_short: '', category_primary: 'social', max_participants: 15, budget_cost: '', website_url: '' })
      setFile(null)
      setMessage('Projekt skapat!')
      await load()
    } catch (err: any) {
      setError(err.message || 'Kunde inte skapa projekt.')
    } finally {
      setUploading(false)
    }
  }

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      setError('')
      await updateProjectStatus(projectId, newStatus)
      setMessage(`Status ändrad till "${PROJECT_STATUS_LABELS[newStatus]}"`)
      await load()
    } catch (err: any) {
      setError(err.message || 'Kunde inte ändra status.')
    }
  }

  const handleBudgetSpentSave = async (projectId: string) => {
    const val = budgetSpentInput[projectId]
    if (!val) return
    try {
      await updateProjectBudgetSpent(projectId, Number(val))
      setMessage('Budget spenderad uppdaterad.')
      await load()
    } catch (err: any) {
      setError(err.message || 'Kunde inte spara budget.')
    }
  }

  const loadHours = async (projectId: string) => {
    try {
      const hours = await getVolunteerHoursForProject(projectId)
      setHoursMap((prev) => ({ ...prev, [projectId]: hours }))
    } catch (err: any) {
      setError(err.message || 'Kunde inte ladda timmar.')
    }
  }

  const toggleProject = async (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null)
    } else {
      setExpandedProject(projectId)
      await loadHours(projectId)
    }
  }

  const handleCompleteProject = async (projectId: string) => {
    try {
      setError('')
      const photoUrls: string[] = []
      for (const photo of resultPhotos) {
        const url = await uploadProjectFile(photo, projectId)
        photoUrls.push(url)
      }
      await updateProjectResults(projectId, resultSummary, photoUrls)
      await updateProjectStatus(projectId, 'completed')
      setResultSummary('')
      setResultPhotos([])
      setMessage('Projekt avslutat med resultat!')
      await load()
    } catch (err: any) {
      setError(err.message || 'Kunde inte avsluta projekt.')
    }
  }

  return (
    <section className="dashboard-layout">
      <div className="stats-grid">
        <article className="card"><h3>Budget allokerad</h3><p>{stats.allocated.toLocaleString('sv-SE')} kr</p></article>
        <article className="card"><h3>Budget spenderad</h3><p>{stats.spent.toLocaleString('sv-SE')} kr</p></article>
        <article className="card"><h3>Projekt i kommunen</h3><p>{stats.projects}</p></article>
        <article className="card"><h3>Deltagare</h3><p>{stats.participants}</p></article>
      </div>

      {/* === CREATE PROJECT FORM === */}
      <form className="card form" onSubmit={onCreate}>
        <h3>Skapa kommunprojekt</h3>

        <div className="form-row">
          <label>Titel *</label>
          <input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} required />
        </div>

        <div className="form-row">
          <label>Beskrivning</label>
          <textarea value={form.description_short} onChange={(e) => setForm((v) => ({ ...v, description_short: e.target.value }))} />
        </div>

        <div className="form-row">
          <label>Kategori *</label>
          <select value={form.category_primary} onChange={(e) => setForm((v) => ({ ...v, category_primary: e.target.value }))}>
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Beräknad kostnad (kr)</label>
          <input type="number" min={0} value={form.budget_cost} onChange={(e) => setForm((v) => ({ ...v, budget_cost: e.target.value }))} placeholder="0" />
        </div>

        <div className="form-row">
          <label>Max deltagare</label>
          <input type="number" min={1} value={form.max_participants} onChange={(e) => setForm((v) => ({ ...v, max_participants: Number(e.target.value) }))} />
        </div>

        <div className="form-row">
          <label>Webbplats (valfritt)</label>
          <input type="url" value={form.website_url} onChange={(e) => setForm((v) => ({ ...v, website_url: e.target.value }))} placeholder="https://..." />
        </div>

        <div className="form-row">
          <label>Bifoga fil (valfritt)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileChange} />
          <small style={{ color: '#888', fontSize: '0.75rem' }}>Endast PDF och bilder (JPG, PNG, GIF, WebP). Max 10 MB.</small>
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button className="btn btn-primary" disabled={uploading}>{uploading ? 'Skapar...' : 'Skapa projekt'}</button>
      </form>

      {/* === PROJECT LIST WITH MANAGEMENT === */}
      <section className="card">
        <h3>Projekt att hantera</h3>
        {projects.length === 0 && <p>Inga projekt ännu.</p>}
        {projects.map((project) => (
          <article key={project.id} className="list-item" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleProject(project.id)}>
              <div>
                <strong>{project.title}</strong>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                  [{PROJECT_STATUS_LABELS[project.status] || project.status}]
                </span>
              </div>
              <span>{expandedProject === project.id ? '▲' : '▼'}</span>
            </div>

            {expandedProject === project.id && (
              <div style={{ marginTop: '1rem' }}>
                {/* Status buttons */}
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Ändra status:</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {(['in_development', 'active', 'completed'] as ProjectStatus[]).map((s) => (
                      <button
                        key={s}
                        className={`btn ${project.status === s ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                        onClick={() => s === 'completed' ? null : handleStatusChange(project.id, s)}
                        disabled={project.status === s}
                      >
                        {PROJECT_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget spent */}
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Budget spenderad:</strong> {(project.budget_spent || 0).toLocaleString('sv-SE')} kr
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      placeholder="Nytt belopp"
                      value={budgetSpentInput[project.id] || ''}
                      onChange={(e) => setBudgetSpentInput((prev) => ({ ...prev, [project.id]: e.target.value }))}
                      style={{ width: '150px' }}
                    />
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => handleBudgetSpentSave(project.id)}>
                      Spara
                    </button>
                  </div>
                </div>

                {/* Volunteer hours */}
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Volontärtimmar:</strong>
                  {(hoursMap[project.id] || []).length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: '#888' }}>Inga timmar registrerade ännu.</p>
                  ) : (
                    <table style={{ width: '100%', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      <thead>
                        <tr><th style={{ textAlign: 'left' }}>Volontär</th><th>Timmar</th><th>Datum</th><th>Beskrivning</th></tr>
                      </thead>
                      <tbody>
                        {(hoursMap[project.id] || []).map((h) => (
                          <tr key={h.id}>
                            <td>{h.users?.full_name || h.users?.email || h.user_id}</td>
                            <td style={{ textAlign: 'center' }}>{h.hours}</td>
                            <td style={{ textAlign: 'center' }}>{h.logged_at}</td>
                            <td>{h.description || '—'}</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 'bold' }}>
                          <td>Totalt</td>
                          <td style={{ textAlign: 'center' }}>{(hoursMap[project.id] || []).reduce((s, h) => s + Number(h.hours), 0)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Complete project with results */}
                {project.status !== 'completed' && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                    <strong>Avsluta projekt med resultat</strong>
                    <div className="form-row" style={{ marginTop: '0.5rem' }}>
                      <label>Sammanfattning av resultat</label>
                      <textarea value={resultSummary} onChange={(e) => setResultSummary(e.target.value)} placeholder="Beskriv vad som uppnåddes..." />
                    </div>
                    <div className="form-row">
                      <label>Resultatbilder (valfritt)</label>
                      <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" multiple onChange={(e) => setResultPhotos(Array.from(e.target.files || []))} />
                      <small style={{ color: '#888', fontSize: '0.75rem' }}>Endast bilder. Max 10 MB per fil.</small>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => handleCompleteProject(project.id)}
                      disabled={!resultSummary.trim()}
                    >
                      Avsluta projekt
                    </button>
                  </div>
                )}

                {/* Show results if completed */}
                {project.status === 'completed' && project.result_summary && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fff0', borderRadius: '8px' }}>
                    <strong>Resultat:</strong>
                    <p>{project.result_summary}</p>
                    {(project.result_photos || []).length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {(project.result_photos || []).map((url, i) => (
                          <img key={i} src={url} alt={`Resultat ${i + 1}`} style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </section>
    </section>
  )
}