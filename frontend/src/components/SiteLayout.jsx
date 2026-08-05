import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Providers', to: '/providers' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Emergency', to: '/emergency' },
]

function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="page-shell">
      <header className="floating-nav">
        <Link className="brand" to="/" aria-label="jeevan108 home">
          jeevan<span>108</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              to={item.to}
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <Link className="text-link desktop-only" to="/auth">
            Sign in
          </Link>
          <Link className="primary-pill desktop-only" to="/providers">
            Find care
          </Link>
          <button
            className="menu-button mobile-only"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {menuOpen ? (
          <div id="mobile-menu" className="mobile-menu">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                className="mobile-nav-link"
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <Link className="mobile-nav-link strong" to="/providers" onClick={() => setMenuOpen(false)}>
              Find care
            </Link>
          </div>
        ) : null}
      </header>

      <Outlet />
    </div>
  )
}

export default SiteLayout