import { useEffect, useMemo, useState } from 'react'
import { applyToProject, filterAndSortProjects, getApplicationsByUser, listProjectsFromApi } from '../../services/projectService'
import { getUserSkills } from '../../services/userService'
import { useUser } from '../../hooks/useUser'
import ProjectCard from '../projects/ProjectCard'
import ProjectSearch from '../projects/ProjectSearch'
import type { Project, ProjectFilters } from '../../types'

export default function VolunteerDashboard() {
  const { userId, profile } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [visibleProjects, setVisibleProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [skillNames, setSkillNames] = useState<string[]>([])
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!userId) return

    try {
      const [allProjects, myApplications, userSkills] = await Promise.all([
        listProjectsFromApi(),
        getApplicationsByUser(userId),
        getUserSkills(userId)
      ])

      const names = userSkills.map((item) => item.skills?.name).filter(Boolean) as string[]
      setSkillNames(names)
      setProjects(allProjects)
      setApplications(myApplications)
      setVisibleProjects(filterAndSortProjects(allProjects, { status: 'active' }, names, profile?.municipality))
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Kunde inte ladda volontärdata.')
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const stats = useMemo(() => {
    const completed = applications.filter((a) => a.status === 'completed')
    const completedHours = completed.reduce((sum, item) => sum + Number(item.hours_completed || 0), 0)
    return {
      completedHours,
      certificates: completed.length,
      skillsMatched: visibleProjects.filter((project) => (project.matchScore || 0) > 60).length
    }
  }, [applications, visibleProjects])

  const handleSearch = (filters: ProjectFilters) => {
    setVisibleProjects(filterAndSortProjects(projects, filters, skillNames, profile?.municipality))
  }

  const handleApply = async (projectId: string) => {
    if (!userId) return
    try {
      await applyToProject({
        project_id: projectId,
        user_id: userId,
        role: 'volunteer',
        hours_completed: 0,
        status: 'pending'
      })
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Kunde inte skicka ansökan.')
    }
  }

  return (
    <section className="dashboard-layout">
      <div className="stats-grid">
        <article className="card"><h3>Timmar genomförda</h3><p>{stats.completedHours}</p></article>
        <article className="card"><h3>Certifikat</h3><p>{stats.certificates}</p></article>
        <article className="card"><h3>Matchade projekt</h3><p>{stats.skillsMatched}</p></article>
      </div>

      <ProjectSearch onSearch={handleSearch} />

      {error && <p className="error">{error}</p>}

      <section className="project-grid">
        {visibleProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onApply={handleApply} />
        ))}
      </section>

      <section className="card">
        <h3>Mina ansökningar</h3>
        {applications.length === 0 && <p>Inga ansökningar ännu.</p>}
        {applications.map((item) => (
          <article key={item.id} className="list-item">
            <strong>{item.projects?.title || item.project_id}</strong>
            <span>{item.status}</span>
          </article>
        ))}
      </section>
    </section>
  )
}
