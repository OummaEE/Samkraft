import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>Samkraft</h4>
          <p>
            Dina kompetenser är värdefulla. Även utan personnummer.
            Plattformen som kopplar samman människor och möjligheter.
          </p>
        </div>
        <div>
          <h4>Kontakt</h4>
          <p>
            <a href="mailto:kontakt@samkraft.se">kontakt@samkraft.se</a>
          </p>
          <p>
            <Link to="/projects">Utforska projekt</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}