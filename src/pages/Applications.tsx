import { useEffect, useState } from 'react'
import { useUser } from '../hooks/useUser'
import { getApplicationsByUser, getProjectsByCreator } from '../services/projectService'
import { supabase } from '../services/supabaseClient'

export default function Applications() {
  const { userId, role } = useUser()
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      try {
        if (role === 'migrant' || role === 'municipality_admin') {
          const myProjects = await getProjectsByCreator(userId)
          if (myProjects.length === 0) {
            setItems([])
            return
          }
          const projectIds = myProjects.map((project) => project.id)
          const { data, error: queryError } = await supabase
            .from('project_participants')
            .select('*, users(full_name, email), projects(title)')
            .in('project_id', projectIds)
          if (queryError) throw queryError
          setItems(data || [])
          return
        }

        setItems(await getApplicationsByUser(userId))
      } catch (err: any) {
        setError(err.message || 'Kunde inte ladda ansökningar.')
      }
    }

    load()
  }, [userId, role])

  return (
    <section className="card">
      <h2>Ansökningar</h2>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && <p>Inga ansökningar tillgängliga.</p>}
      {items.map((item) => (
        <article key={item.id} className="list-item">
          <strong>{item.projects?.title || item.project_id}</strong>
          <span>{item.status}</span>
        </article>
      ))}
    </section>
  )
}
