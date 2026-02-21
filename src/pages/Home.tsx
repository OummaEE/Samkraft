import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { authUser } = useAuth()

  return (
    <section>
      <div className="hero card">
        <h1>Dina kompetenser är värdefulla. Även utan personnummer.</h1>
        <p className="lead">Bygg din portfolio genom verifierade volontärprojekt</p>
        <div className="hero-actions">
          {!authUser && <Link to="/register" className="btn btn-primary">Redo att börja?</Link>}
          {!authUser && <Link to="/login" className="btn btn-secondary">Gå med i hundratals personer</Link>}
          {authUser && <Link to="/dashboard" className="btn btn-primary">Gå till dashboard</Link>}
        </div>
      </div>

      <section className="section-grid">
        <article className="card"><h3>Sociala kopplingar</h3><p>Minskar isolering och bygger nätverk.</p></article>
        <article className="card"><h3>Kompetensutveckling</h3><p>Nya karriärmöjligheter genom praktisk erfarenhet.</p></article>
        <article className="card"><h3>Positiv identitet</h3><p>Känna sig värderad genom verkliga bidrag.</p></article>
        <article className="card"><h3>Konstruktiva alternativ</h3><p>Meningsfulla initiativ i lokalsamhället.</p></article>
      </section>

      <section className="card">
        <h2>Så fungerar Samkraft</h2>
        <ol className="steps-list">
          <li>Skapa en projektplattform - digital plattform för att föreslå projekt</li>
          <li>Engagera volontärer och mentorer - svenska medborgare som stödjer</li>
          <li>Genomföra projekt - godkända idéer realiseras</li>
          <li>Utvärdering och spridning - resultat utvärderas, deltagare får intyg</li>
        </ol>
      </section>
    </section>
  )
}
