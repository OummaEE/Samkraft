import { useState, type FormEvent } from 'react'

interface Props {
  onClose: () => void
}

export default function ContactModal({ onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    // For now, just show success. Hook up to Supabase or email later.
    setSent(true)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Stäng">
          ✕
        </button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <img
              src="/images/icons/heart.png"
              alt=""
              style={{ width: 48, margin: '0 auto 1rem', opacity: 0.7 }}
            />
            <h2>Tack för ditt meddelande!</h2>
            <p style={{ color: '#555' }}>
              Vi återkommer så snart vi kan.
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              Stäng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Skicka ett meddelande</h2>

            <div className="form-row">
              <label htmlFor="contact-name">Namn</label>
              <input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="contact-email">E-post</label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="contact-message">Meddelande</label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Skicka meddelande
            </button>
          </form>
        )}
      </div>
    </div>
  )
}