import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Testimonials from '../components/common/Testimonials'

export default function Home() {
  const { authUser } = useAuth()

  return (
    <>
      {/* ===== HERO ===== */}
      <div className="hero">
        <div className="hero-doodles">
          <img src="/images/decorative/blob-red.png" alt="" className="hero-doodle blob-red" />
          <img src="/images/decorative/blob-yellow.png" alt="" className="hero-doodle blob-yellow" />
          <img src="/images/decorative/stars.png" alt="" className="hero-doodle stars-top" />
          <img src="/images/decorative/stars.png" alt="" className="hero-doodle stars-bottom" />
          <img src="/images/icons/smiley.png" alt="" className="hero-doodle smiley" />
          <img src="/images/icons/magnifier.png" alt="" className="hero-doodle magnifier" />
          <img src="/images/decorative/hand-pitcher.png" alt="" className="hero-doodle hand-pitcher" />
          <img src="/images/decorative/hand-pointing.png" alt="" className="hero-doodle hand-pointing" />
          <img src="/images/icons/people-idea.png" alt="" className="hero-doodle people-idea" />
        </div>

        <h1>Dina kompetenser är värdefulla. Även utan personnummer.</h1>
        <p className="lead">
          Samkraft är en plattform för kommunerna <strong>Flen</strong> och{' '}
          <strong>Katrineholm</strong>. Bygg din portfolio genom verifierade
          volontärprojekt — och visa vad du kan, oavsett bakgrund.
        </p>
        <div className="hero-actions">
          {!authUser && (
            <>
              <Link to="/register" className="btn btn-primary">
                Kom igång gratis
              </Link>
              <Link to="/projects" className="btn btn-secondary">
                Utforska projekt
              </Link>
            </>
          )}
          {authUser && (
            <Link to="/dashboard" className="btn btn-primary">
              Gå till dashboard
            </Link>
          )}
        </div>
      </div>

      <main className="container section">
        {/* ===== VALUE PROPS ===== */}
        <div className="section-grid">
          <article className="card">
            <img src="/images/icons/people-idea.png" alt="" />
            <h3>Sociala kopplingar</h3>
            <p>Minskar isolering och bygger nätverk i ditt lokalsamhälle.</p>
          </article>
          <article className="card">
            <img src="/images/icons/magnifier.png" alt="" />
            <h3>Kompetensutveckling</h3>
            <p>Nya karriärmöjligheter genom praktisk erfarenhet och mentorskap.</p>
          </article>
          <article className="card">
            <img src="/images/icons/check.png" alt="" />
            <h3>Positiv identitet</h3>
            <p>Känna sig värderad genom verkliga bidrag till samhället.</p>
          </article>
          <article className="card">
            <img src="/images/icons/smiley.png" alt="" />
            <h3>Konstruktiva alternativ</h3>
            <p>Meningsfulla initiativ som stärker hela lokalsamhället.</p>
          </article>
        </div>

        {/* ===== EDITORIAL ZIGZAG ===== */}
        <div className="feature-section">
          <div className="feature-text">
            <h3>Skapa projekt som förändrar</h3>
            <p>
              Föreslå volontärprojekt, engagera ditt nätverk och genomför idéer
              som gör skillnad. Allt dokumenteras och verifieras på plattformen.
            </p>
            <Link to="/register" className="btn btn-accent">
              Starta ett projekt
            </Link>
          </div>
          <div className="feature-visual">
            <img src="/images/features/project-creation.png" alt="Skapa projekt" />
          </div>
        </div>

        <div className="feature-section">
          <div className="feature-text">
            <h3>Matchning med volontärer</h3>
            <p>
              Vår smarta matchning kopplar samman projekt med rätt kompetenser.
              Volontärer hittar meningsfulla uppdrag baserade på sina färdigheter.
            </p>
            <Link to="/projects" className="btn btn-secondary">
              Se aktuella projekt
            </Link>
          </div>
          <div className="feature-visual">
            <img src="/images/features/matching.png" alt="Matchning" />
          </div>
        </div>

        <div className="feature-section">
          <div className="feature-text">
            <h3>Verifierade certifikat</h3>
            <p>
              Varje genomfört projekt ger ett verifierbart certifikat — ett
              kvitto på dina insatser som du kan visa för framtida arbetsgivare.
            </p>
            <Link to="/register" className="btn btn-accent">
              Börja bygga din portfolio
            </Link>
          </div>
          <div className="feature-visual">
            <img src="/images/features/certificates.png" alt="Certifikat" />
          </div>
        </div>

        {/* ===== HOW IT WORKS ===== */}
        <div className="how-it-works">
          <h2>Så fungerar Samkraft</h2>
          <div className="steps-grid">
            <div className="step-card">
              <h4>Föreslå ett projekt</h4>
              <p>Beskriv din idé på plattformen — det tar bara några minuter.</p>
            </div>
            <div className="step-card">
              <h4>Engagera volontärer</h4>
              <p>Svenska medborgare och mentorer ansluter sig till ditt projekt.</p>
            </div>
            <div className="step-card">
              <h4>Genomför tillsammans</h4>
              <p>Jobba ihop, logga timmar och dokumentera resultaten.</p>
            </div>
            <div className="step-card">
              <h4>Få ditt certifikat</h4>
              <p>Resultat utvärderas och deltagare får verifierade intyg.</p>
            </div>
          </div>
        </div>
      </main>

      <Testimonials />
    </>
  )
}