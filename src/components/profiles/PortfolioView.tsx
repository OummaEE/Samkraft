interface Props {
  data: any
}

export default function PortfolioView({ data }: Props) {
  if (!data) {
    return <section className="card">Ingen portfolio-data tillgänglig.</section>
  }

  const stats = data.stats || {}

  return (
    <section className="card">
      <h3>Portfolio</h3>
      <div className="stats-grid">
        <div><strong>Projekt:</strong> {stats.total_projects ?? 0}</div>
        <div><strong>Certifikat:</strong> {stats.total_certificates ?? 0}</div>
        <div><strong>Kompetenser:</strong> {stats.total_skills ?? 0}</div>
        <div><strong>Impact score:</strong> {stats.impact_score ?? 0}</div>
      </div>
    </section>
  )
}
