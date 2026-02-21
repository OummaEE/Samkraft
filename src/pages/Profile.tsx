import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import UserProfileCard from '../components/profiles/UserProfile'
import PortfolioView from '../components/profiles/PortfolioView'
import { getProfileByUsername } from '../services/userService'

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

      if (profileData?.username) {
        const response = await fetch(`/api/users/${profileData.username}/portfolio`)
        if (response.ok) {
          const payload: any = await response.json()
          setPortfolio(payload.data)
        }
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
