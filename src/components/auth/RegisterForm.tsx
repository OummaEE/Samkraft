import { useEffect, useState, useRef, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../services/supabaseClient'
import type { Municipality, UserRole } from '../../types'
import RoleSelector from './RoleSelector'
import TurnstileWidget from './TurnstileWidget'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('volunteer')
  const [municipality, setMunicipality] = useState('')
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [formLoadedAt] = useState(Date.now())
  const [turnstileKey, setTurnstileKey] = useState(0)

  const { register, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('municipalities')
          .select('*')
          .eq('active', true)
          .order('name')
        if (error) {
          console.error('municipalities error:', error)
          return
        }
        setMunicipalities(data || [])
      } catch (err) {
        console.error('Failed to load municipalities:', err)
      }
    }
    load()
  }, [])

  const resetTurnstile = () => {
    setTurnstileToken(null)
    setTurnstileKey(prev => prev + 1)
  }

  const validate = () => {
    if (!fullName.trim()) return 'Fullständigt namn är obligatoriskt.'
    if (!emailRegex.test(email)) return 'Ange en giltig e-postadress.'
    if (password.length < 8) return 'Lösenord måste vara minst 8 tecken.'
    if (!role) return 'Välj roll.'
    return ''
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (honeypot) { setError(''); return }
    if (Date.now() - formLoadedAt < 3000) {
      setError('Något gick fel. Vänta en stund och försök igen.')
      return
    }
    if (!turnstileToken) {
      setError('Vänta tills säkerhetskontrollen är klar.')
      return
    }
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')

    try {
      const verifyRes = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      })
      if (!verifyRes.ok) {
        resetTurnstile()
        setError('Säkerhetskontrollen misslyckades. Vänta tills den laddas om och försök igen.')
        return
      }
      await register({ email, password, fullName, role, municipality: municipality || undefined })
      navigate('/dashboard')
    } catch (err: any) {
      resetTurnstile()
      setError(err.message || 'Registrering misslyckades.')
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h2>Skapa konto</h2>

      <div className="form-row">
        <label htmlFor="fullName">Fullständigt namn</label>
        <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>

      <div className="form-row">
        <label htmlFor="register-email">E-post</label>
        <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="form-row">
        <label htmlFor="register-password">Lösenord</label>
        <input id="register-password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <RoleSelector value={role} onChange={setRole} />

      <div className="form-row">
        <label htmlFor="municipality">Kommun</label>
        <select id="municipality" value={municipality} onChange={(e) => setMunicipality(e.target.value)}>
          <option value="">Välj kommun</option>
          {municipalities.map((item) => (
            <option key={item.id} value={item.name}>{item.name}</option>
          ))}
        </select>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <label htmlFor="hp_field">Fax</label>
        <input
          id="hp_field"
          name="hp_field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <TurnstileWidget
        key={turnstileKey}
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
      />

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading || !turnstileToken}>
        {loading ? 'Skapar konto...' : 'Registrera'}
      </button>

      <p>
        Har du redan konto? <Link to="/login">Logga in</Link>
      </p>
    </form>
  )
}
