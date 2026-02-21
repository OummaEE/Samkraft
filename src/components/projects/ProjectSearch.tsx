import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../services/supabaseClient'
import type { Municipality, ProjectFilters, Skill } from '../../types'

interface Props {
  onSearch: (filters: ProjectFilters) => void
}

export default function ProjectSearch({ onSearch }: Props) {
  const [municipality, setMunicipality] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState<'best_match' | 'newest' | 'popular'>('best_match')
  const [skills, setSkills] = useState<string[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [allSkills, setAllSkills] = useState<Skill[]>([])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [municipalityRes, skillRes] = await Promise.all([
          supabase.from('municipalities').select('*').eq('active', true),
          supabase.from('skills').select('*')
        ])
        setMunicipalities(municipalityRes.data || [])
        setAllSkills(skillRes.data || [])
      } catch (error) {
        console.error(error)
      }
    }

    bootstrap()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch({
      municipality: municipality || undefined,
      category: category || undefined,
      status: 'active',
      skills,
      sortBy
    })
  }

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]
    )
  }

  return (
    <form className="card project-search" onSubmit={submit}>
      <h3>Sök projekt</h3>
      <div className="filter-grid">
        <div className="form-row">
          <label htmlFor="filter-municipality">Kommun</label>
          <select
            id="filter-municipality"
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
          >
            <option value="">Alla kommuner</option>
            {municipalities.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="filter-category">Kategori</label>
          <input
            id="filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="t.ex. social"
          />
        </div>

        <div className="form-row">
          <label htmlFor="sort-by">Sortera</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="best_match">Bäst match</option>
            <option value="newest">Nyast</option>
            <option value="popular">Mest populär</option>
          </select>
        </div>
      </div>

      <div className="skills-wrap">
        {allSkills.slice(0, 14).map((skill) => (
          <button
            type="button"
            key={skill.id}
            className={`chip ${skills.includes(skill.name) ? 'active' : ''}`}
            onClick={() => toggleSkill(skill.name)}
          >
            {skill.name}
          </button>
        ))}
      </div>

      <button type="submit" className="btn btn-primary">
        Sök
      </button>
    </form>
  )
}
