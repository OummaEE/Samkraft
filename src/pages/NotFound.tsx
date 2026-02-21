import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="card">
      <h2>Sidan hittades inte</h2>
      <p>Kontrollera länken eller gå tillbaka till startsidan.</p>
      <Link to="/" className="btn btn-primary">Till Home</Link>
    </section>
  )
}
