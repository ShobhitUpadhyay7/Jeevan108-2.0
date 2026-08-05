import { Link } from 'react-router-dom'

const listings = [
  { name: 'Meera Krishnan', role: 'Nurse', rating: '4.9', price: '₹600', location: 'Bengaluru' },
  { name: 'Anita Rao', role: 'Caretaker', rating: '4.8', price: '₹450', location: 'Mysuru' },
  { name: 'Rakesh Kumar', role: 'Compounder', rating: '4.7', price: '₹500', location: 'Hubballi' },
]

function MarketplacePage() {
  return (
    <main className="page-section">
      <div className="page-card">
        <p className="section-kicker">Marketplace</p>
        <h1>Browse verified professionals</h1>
        <p className="section-subtitle">Hardcoded marketplace preview with filters, ratings, and quick booking actions.</p>
        <div className="listing-grid">
          {listings.map((listing) => (
            <article key={listing.name} className="listing-card">
              <span className="listing-role">{listing.role}</span>
              <h3>{listing.name}</h3>
              <p>{listing.location}</p>
              <strong>{listing.price}</strong>
              <span>Rating {listing.rating}</span>
            </article>
          ))}
        </div>
        <div className="page-actions">
          <Link className="primary-pill" to="/booking">
            Book now
          </Link>
          <Link className="secondary-pill" to="/search">
            Search more
          </Link>
        </div>
      </div>
    </main>
  )
}

export default MarketplacePage