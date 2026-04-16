import './Header.css'

const headerLinks = [
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Models', href: '#models' },
  { label: 'Reading notes', href: '#documentation' },
]

const readingGuide = [
  'Pick a state, then collapse or expand each model family.',
  'Dashed lines show family averages while expanded families reveal each model.',
  'Actual generation stays visible, so forecast drift is easy to spot.',
]

const contextTags = ['Monthly forecasts', 'Top U.S. wind states', 'Actual vs predicted']

function Header() {
  return (
    <header className="we-header">
      <div className="we-header-shell">
        <div className="we-header-main">
          <span className="we-header-eyebrow">Wind generation observatory</span>
          <h1 className="we-header-title">Wind Energy Prediction Dashboard</h1>
          <p className="we-header-subtitle">
            A calmer way to compare monthly wind generation forecasts across the major
            U.S. wind-producing states.
          </p>

          <div className="we-header-actions">
            {headerLinks.map((link) => (
              <a key={link.href} className="we-header-link" href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <aside className="we-header-aside" aria-label="How to read the dashboard">
          <div className="we-header-card">
            <p className="we-header-card-label">How to read it</p>
            <ul className="we-header-guide">
              {readingGuide.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="we-header-tags">
            {contextTags.map((tag) => (
              <span key={tag} className="we-header-tag">
                {tag}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </header>
  )
}

export default Header


