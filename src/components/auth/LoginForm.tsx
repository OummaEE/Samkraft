import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('E-post och lösenord är obligatoriska.')
      return
    }

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Inloggning misslyckades.')
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h2>Logga in</h2>
      <div className="form-row">
        <label htmlFor="email">E-post</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="form-row">
        <label htmlFor="password">Lösenord</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Loggar in...' : 'Logga in'}
      </button>

      <p>
        Saknar konto? <Link to="/register">Registrera här</Link>
      </p>
    </form>
  )
}

