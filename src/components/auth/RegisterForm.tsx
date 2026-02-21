import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../services/supabaseClient'
import type { Municipality, UserRole } from '../../types'
import RoleSelector from './RoleSelector'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('volunteer')
  const [municipality, setMunicipality] = useState('')
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [error, setError] = useState('')
const { data } = await supabase.from('municipalities').select('*').eq('active', true)

  const { register, loading } = useAuth()
  const navigate = useNavigate()


  useEffect(() => {
    const loadMunicipalities = async () => {
      try {
        const { data } = await supabase
          .from('municipalities')
          .select('*')
          .eq('active', true)
        setMunicipalities(data || [])
      } catch (err) {
        console.error(err)
      }
    }

    loadMunicipalities()
  }, [])

  const validate = () => {
    if (!fullName.trim()) return 'Fullständigt namn är obligatoriskt.'
    if (!emailRegex.test(email)) return 'Ange en giltig e-postadress.'
    if (password.length < 8) return 'Lösenord måste vara minst 8 tecken.'
    if (!role) return 'Välj roll.'
    return ''
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')

    try {
      await register({
        email,
        password,
        fullName,
        role,
        municipality: municipality || undefined
      })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registrering misslyckades.')
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h2>Skapa konto</h2>

      <div className="form-row">
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="register-email">E-post</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="register-password">Lösenord</label>
        <input
          id="register-password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <RoleSelector value={role} onChange={setRole} />

      <div className="form-row">
        <label htmlFor="municipality">Kommun</label>
        <select
          id="municipality"
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
        >
          <option value="">Välj kommun</option>
          {municipalities.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Skapar konto...' : 'Registrera'}
      </button>

      <p>
        Har du redan konto? <Link to="/login">Logga in</Link>
      </p>
    </form>
  )
}
