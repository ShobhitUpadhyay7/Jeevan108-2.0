function EmergencyPage() {
  const emergencies = ['Snake bite', 'Burns', 'Cardiac event', 'Choking', 'Stroke', 'Seizure']

  return (
    <main className="page-section">
      <div className="page-card">
        <p className="section-kicker">Emergency guide</p>
        <h1>Fast, structured help when time matters</h1>
        <p className="section-subtitle">Static content only, with clear call-to-action emphasis.</p>
        <div className="emergency-grid">
          {emergencies.map((item) => (
            <article key={item} className="emergency-card">
              {item}
            </article>
          ))}
        </div>
        <a className="primary-pill" href="tel:108">
          Call ambulance
        </a>
      </div>
    </main>
  )
}

export default EmergencyPage