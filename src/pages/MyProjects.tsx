import { useEffect, useState } from 'react'
import { useUser } from '../hooks/useUser'
import { getProjectsByCreator, getApplicationsByUser } from '../services/projectService'

export default function MyProjects() {
  const { role, userId } = useUser()
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      try {
        if (role === 'migrant' || role === 'municipality_admin') {
          setItems(await getProjectsByCreator(userId))
        } else {
          setItems(await getApplicationsByUser(userId))
        }
      } catch (err: any) {
        setError(err.message || 'Kunde inte ladda data.')
      }
    }

    load()
  }, [userId, role])

  return (
    <section className="card">
      <h2>Mina projekt</h2>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && <p>Inga poster ännu.</p>}
      {items.map((item: any) => (
        <article key={item.id} className="list-item">
          <strong>{item.title || item.projects?.title || item.project_id}</strong>
          <span>{item.status}</span>
        </article>
      ))}
    </section>
  )
}
