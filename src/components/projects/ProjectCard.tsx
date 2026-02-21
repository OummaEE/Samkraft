import { Link } from 'react-router-dom'
import type { Project } from '../../types'

interface Props {
  project: Project
  onApply?: (projectId: string) => Promise<void>
  showApply?: boolean
}

export default function ProjectCard({ project, onApply, showApply = true }: Props) {
  const spotsLeft = Math.max((project.max_participants || 0) - (project.current_participants || 0), 0)

  return (
    <article className="card project-card">
      <h3>{project.title}</h3>
      <p>{project.description_short || 'Ingen beskrivning tillgänglig.'}</p>
      <div className="project-meta">
        <span>Kategori: {project.category_primary || 'Övrigt'}</span>
        <span>Kommun: {project.location_municipality || 'Ej angiven'}</span>
        <span>Platser kvar: {spotsLeft}</span>
        {typeof project.matchScore === 'number' && <span>Match: {project.matchScore}%</span>}
      </div>
      <div className="project-actions">
        <Link to={`/projects/${project.id}`} className="btn btn-secondary">Detaljer</Link>
        {showApply && onApply && (
          <button className="btn btn-primary" onClick={() => onApply(project.id)}>
            Ansök
          </button>
        )}
      </div>
    </article>
  )
}
