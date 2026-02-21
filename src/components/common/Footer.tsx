import { useState } from 'react'
import { Link } from 'react-router-dom'
import ContactModal from './ContactModal'

export default function Footer() {
  const [showContact, setShowContact] = useState(false)

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-col">
              <h4>Plattform</h4>
              <Link to="/">Hem</Link>
              <Link to="/projects">Projekt</Link>
              <Link to="/register">Registrera</Link>
              <Link to="/login">Logga in</Link>
            </div>

            <div className="footer-col">
              <h4>Information</h4>
              <a href="#">Om Samkraft</a>
              <a href="#">Integritetspolicy</a>
              <a href="#">Villkor</a>
              <a href="#">FAQ</a>
            </div>

            <div className="footer-col">
              <h4>Följ oss</h4>
              <a href="#" className="footer-social-link">
                <img src="/images/icons/instagram.png" alt="" />
                Instagram
              </a>
              <a href="#" className="footer-social-link">
                <img src="/images/icons/youtube.png" alt="" />
                YouTube
              </a>
              <a href="#" className="footer-social-link">
                <img src="/images/icons/spotify.png" alt="" />
                Spotify
              </a>
              <a href="#" className="footer-social-link">
                <img src="/images/icons/podcast.png" alt="" />
                Podcast
              </a>
            </div>

            <div className="footer-col footer-contact-col">
              <h4>Har du frågor?</h4>
              <button
                className="btn btn-ghost"
                onClick={() => setShowContact(true)}
              >
                Kontakta oss
              </button>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="brand">Samkraft</span>
            <p>&copy; Samkraft {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  )
}