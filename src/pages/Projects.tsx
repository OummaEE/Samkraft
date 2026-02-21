import { useEffect, useState } from 'react'
import ProjectSearch from '../components/projects/ProjectSearch'
import ProjectCard from '../components/projects/ProjectCard'
import { applyToProject, filterAndSortProjects, listProjectsFromApi } from '../services/projectService'
import { getUserSkills } from '../services/userService'
import { useUser } from '../hooks/useUser'
import type { Project, ProjectFilters } from '../types'

export default function Projects() {
  const { userId, profile } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [visible, setVisible] = useState<Project[]>([])
  const [userSkillNames, setUserSkillNames] = useState<string[]>([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const allProjects = await listProjectsFromApi()
      setProjects(allProjects)

      if (userId) {
        const userSkills = await getUserSkills(userId)
        const names = userSkills.map((item) => item.skills?.name).filter(Boolean) as string[]
        setUserSkillNames(names)
        setVisible(filterAndSortProjects(allProjects, { status: 'active' }, names, profile?.municipality))
      } else {
        setVisible(allProjects)
      }
    } catch (err: any) {
      setError(err.message || 'Kunde inte ladda projekt.')
    }
  }

  useEffect(() => {
    load()
  }, [userId])

  const onSearch = (filters: ProjectFilters) => {
    setVisible(filterAndSortProjects(projects, filters, userSkillNames, profile?.municipality))
  }

  const onApply = async (projectId: string) => {
    if (!userId) {
      setError('Du måste vara inloggad för att ansöka.')
      return
    }

    try {
      await applyToProject({
        project_id: projectId,
        user_id: userId,
        role: profile?.role || 'volunteer',
        hours_completed: 0,
        status: 'pending'
      })
      await load()
    } catch (err: any) {
      setError(err.message || 'Kunde inte ansöka.')
    }
  }

  return (
    <section>
      <ProjectSearch onSearch={onSearch} />
      {error && <p className="error">{error}</p>}

      <div className="project-grid">
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} onApply={onApply} showApply={!!userId} />
        ))}
      </div>
    </section>
  )
}
