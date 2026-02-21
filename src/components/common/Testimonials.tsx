import { useState } from 'react'

const quotes = [
  {
    text: 'Samkraft hjälpte mig att visa mina kompetenser och hitta ett nätverk i min nya kommun. Jag kände mig äntligen som en del av samhället.',
    author: 'Amira K.'
  },
  {
    text: 'Som mentor har jag sett hur volontärprojekt kan förändra människors liv. Plattformen gör det enkelt att koppla samman rätt människor.',
    author: 'Erik L.'
  },
  {
    text: 'Certifikaten jag fick genom Samkraft var avgörande när jag sökte jobb. Arbetsgivaren sa att det var det som gjorde skillnaden.',
    author: 'Fatima H.'
  },
  {
    text: 'En fantastisk plattform som bygger broar mellan människor. Vi har genomfört tre projekt i vår kommun och resultaten talar för sig själva.',
    author: 'Maria S.'
  }
]

export default function Testimonials() {
  const [index, setIndex] = useState(0)

  const prev = () => setIndex((i) => (i === 0 ? quotes.length - 1 : i - 1))
  const next = () => setIndex((i) => (i === quotes.length - 1 ? 0 : i + 1))

  return (
    <section className="testimonials">
      <div className="container">
        <div className="testimonials-header">
          <img
            src="/images/decorative/stars.png"
            alt=""
            className="doodle"
            style={{ alignSelf: 'flex-start' }}
          />
          <div style={{ textAlign: 'center' }}>
            <img
              src="/images/icons/smiley.png"
              alt=""
              style={{ width: 32, margin: '0 auto 0.5rem', opacity: 0.6 }}
            />
            <h2>Vad folk säger</h2>
            <img
              src="/images/decorative/squiggly-line.png"
              alt=""
              className="squiggly"
              style={{ margin: '0 auto' }}
            />
          </div>
          <img
            src="/images/decorative/stars.png"
            alt=""
            className="doodle"
            style={{ alignSelf: 'flex-start' }}
          />
        </div>

        <div className="testimonial-slide">
          <blockquote>"{quotes[index].text}"</blockquote>
          <cite>— {quotes[index].author}</cite>
        </div>

        <div className="testimonial-nav">
          <button onClick={prev} aria-label="Föregående">
            <img src="/images/icons/arrow-left.png" alt="Föregående" />
          </button>

          <div className="testimonial-dots">
            {quotes.map((_, i) => (
              <button
                key={i}
                className={i === index ? 'active' : ''}
                onClick={() => setIndex(i)}
                aria-label={`Visa citat ${i + 1}`}
              />
            ))}
          </div>

          <button onClick={next} aria-label="Nästa">
            <img src="/images/icons/arrow-right.png" alt="Nästa" />
          </button>
        </div>
      </div>
    </section>
  )
}