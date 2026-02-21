import type { Project } from '../../types'

interface Props {
  project: Project
  onApply?: () => Promise<void>
  canApply?: boolean
}

export default function ProjectDetail({ project, onApply, canApply = false }: Props) {
  return (
    <section className="card">
      <h2>{project.title}</h2>
      <p>{project.description_short || 'Ingen beskrivning tillgänglig.'}</p>
      <div className="project-meta">
        <span>Status: {project.status}</span>
        <span>Kategori: {project.category_primary || 'Övrigt'}</span>
        <span>Kommun: {project.location_municipality || 'Ej angiven'}</span>
        <span>Deltagare: {project.current_participants || 0} / {project.max_participants || 0}</span>
      </div>
      {canApply && onApply && (
        <button className="btn btn-primary" onClick={onApply}>
          Ansök till projektet
        </button>
      )}
    </section>
  )
}
