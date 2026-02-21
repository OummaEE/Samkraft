import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import UserProfileCard from '../components/profiles/UserProfile'
import PortfolioView from '../components/profiles/PortfolioView'
import { getProfileByUsername } from '../services/userService'
import { supabase } from '../services/supabaseClient'

export default function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState<any>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!username) return
      const profileData = await getProfileByUsername(username)
      setProfile(profileData)

      if (profileData) {
        const [certRes, skillRes] = await Promise.all([
          supabase
            .from('certificates')
            .select('id')
            .eq('user_id', profileData.id),
          supabase
            .from('user_skills')
            .select('id')
            .eq('user_id', profileData.id)
        ])

        const totalCertificates = certRes.data?.length ?? 0
        const totalSkills = skillRes.data?.length ?? 0

        setPortfolio({
          stats: {
            total_projects: 0,
            total_certificates: totalCertificates,
            total_skills: totalSkills,
            impact_score: 0
          }
        })
      }
    }

    load().catch((err) => setError(err.message || 'Kunde inte ladda profil.'))
  }, [username])

  if (!profile && !error) return <p>Laddar profil...</p>

  return (
    <section>
      {error && <p className="error">{error}</p>}
      {profile && <UserProfileCard profile={profile} />}
      <PortfolioView data={portfolio} />
    </section>
  )
}
