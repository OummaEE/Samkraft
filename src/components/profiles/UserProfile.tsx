import type { UserProfile } from '../../types'

interface Props {
  profile: UserProfile
}

export default function UserProfileCard({ profile }: Props) {
  return (
    <section className="card">
      <h2>{profile.full_name}</h2>
      <p><strong>Roll:</strong> {profile.role}</p>
      <p><strong>Kommun:</strong> {profile.municipality || 'Ej angiven'}</p>
      <p><strong>Bio:</strong> {profile.bio || 'Ingen bio ännu.'}</p>
      <p><strong>Skapad:</strong> {profile.created_at}</p>
    </section>
  )
}
