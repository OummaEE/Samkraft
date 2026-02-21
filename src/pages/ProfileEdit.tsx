import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { setUserSkills, updateProfile } from '../services/userService'

export default function ProfileEdit() {
  const { profile, userId } = useUser()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [skillText, setSkillText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name || '')
    setBio(profile.bio || '')
    setMunicipality(profile.municipality || '')
    setAvatarUrl(profile.avatar_url || '')
  }, [profile])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!fullName.trim()) {
      setError('Fullständigt namn är obligatoriskt.')
      return
    }

    try {
      await updateProfile(userId, {
        full_name: fullName,
        bio,
        municipality,
        avatar_url: avatarUrl
      })

      const skillIds = skillText
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean)
        .map((skill_id: string) => ({ skill_id, proficiency_level: 3 }))

      await setUserSkills(userId, skillIds)

      setError('')
      setSuccess('Profil uppdaterad.')
      navigate(`/profile/${profile?.username || userId}`)
    } catch (err: any) {
      setSuccess('')
      setError(err.message || 'Kunde inte uppdatera profil.')
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h2>Redigera profil</h2>
      <div className="form-row">
        <label>Full name *</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="form-row">
        <label>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Kommun</label>
        <input value={municipality} onChange={(e) => setMunicipality(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Avatar URL</label>
        <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Skills (skill_id, skill_id)</label>
        <input value={skillText} onChange={(e) => setSkillText(e.target.value)} />
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button className="btn btn-primary">Spara profil</button>
    </form>
  )
}

