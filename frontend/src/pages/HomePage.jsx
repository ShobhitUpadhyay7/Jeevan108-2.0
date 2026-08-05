import { Link } from 'react-router-dom'

const trustStats = [
  { value: '12k+', label: 'Families supported' },
  { value: '4.9/5', label: 'Average rating' },
  { value: '24/7', label: 'Support ready' },
  { value: '98%', label: 'Verified care' },
]

const services = [
  {
    title: 'Home Nurses',
    description:
      'Certified nursing support for wound care, recovery monitoring, and assisted treatment at home.',
    features: ['Post-surgical support', 'Vital checks', 'Medication reminders'],
  },
  {
    title: 'Caretakers',
    description:
      'Warm, reliable daily help for elderly care, mobility support, hygiene, and companionship.',
    features: ['Full-day assistance', 'Elderly care', 'Meal and routine help'],
  },
  {
    title: 'Compounders',
    description:
      'Practical medical assistance for injections, dressing changes, and home-based procedure support.',
    features: ['Quick visits', 'Basic procedures', 'Home coordination'],
  },
]

function HomePage() {
  return (
    <main>
      <section className="home-hero" id="home">
        <div className="home-hero-content">
          <div className="home-hero-copy">
            <p className="eyebrow">Your health, our priority</p>
            <h1>
              <span>Empowering you to live</span>
              <span>A healthier life</span>
            </h1>
            <p className="hero-copy">
              Discover expert care, advice, and tools to support recovery, daily assistance, and confident
              home-based healthcare.
            </p>
            <div className="hero-actions">
              <Link className="primary-pill" to="/providers">
                Browse providers
              </Link>
              <Link className="secondary-pill" to="/application">
                Join as a professional
              </Link>
            </div>
          </div>

          <div className="home-hero-aside" aria-label="Home care highlights">
            <div className="hero-aside-orb hero-aside-orb-one" aria-hidden="true" />
            <div className="hero-aside-orb hero-aside-orb-two" aria-hidden="true" />
            <div className="hero-aside-card hero-aside-card-main">
              <span className="hero-aside-badge">24/7</span>
              <strong>Ready when you need care most</strong>
              <p>Fast access to verified nurses, caretakers, and compounders for home support.</p>
            </div>
            <div className="hero-aside-card hero-aside-card-mini hero-aside-card-top">
              <strong>Same-day support</strong>
              <span>Home visits, quickly arranged.</span>
            </div>
            <div className="hero-aside-card hero-aside-card-mini hero-aside-card-bottom">
              <strong>Trusted professionals</strong>
              <span>Reliable care for families.</span>
            </div>
          </div>

          <div className="hero-metrics" aria-label="Trust indicators">
            {trustStats.map((stat) => (
              <article key={stat.label} className="hero-metric">
                <span className="hero-metric-icon" aria-hidden="true">
                  <span />
                </span>
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-section" id="providers">
        <div className="section-heading center">
          <p className="section-kicker">Why families choose Jeevan108</p>
          <h1>
            Trusted care,
            <br />
            delivered with speed.
          </h1>
        </div>
        <div className="trust-grid">
          {trustStats.map((stat, index) => (
            <article key={stat.label} className={`trust-card ${index === 2 ? 'highlight' : ''}`}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="services-section" id="services">
        <p className="section-kicker">Available services</p>
        <h2>Simple care options for the moments that matter.</h2>
        <div className="services-grid">
          {services.map((service) => (
            <article key={service.title} className="service-card">
              <div className="service-icon" aria-hidden="true">
                <span />
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ul>
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link className="service-button" to="/providers">
                Explore service
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default HomePage