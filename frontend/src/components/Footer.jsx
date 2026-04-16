import './Footer.css'

const REPO_URL = 'https://github.com/ishan372or/Wind_Energy_Generation'
const ISSUES_URL = `${REPO_URL}/issues`

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="we-footer">
      <div className="we-footer-content">
        <div className="we-footer-section">
          <span className="we-footer-kicker">Project note</span>
          <h4>Wind Energy Dashboard</h4>
          <p>
            Built for comparing monthly wind generation forecasts against observed output
            without losing the broader story.
          </p>
        </div>

        <div className="we-footer-section">
          <h4>Jump to</h4>
          <ul>
            <li>
              <a href="#dashboard">Dashboard</a>
            </li>
            <li>
              <a href="#models">Models</a>
            </li>
            <li>
              <a href="#documentation">Documentation</a>
            </li>
          </ul>
        </div>

        <div className="we-footer-section">
          <h4>Project links</h4>
          <ul>
            <li>
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href="/api/models" target="_blank" rel="noreferrer">
                Live API
              </a>
            </li>
            <li>
              <a href={ISSUES_URL} target="_blank" rel="noreferrer">
                Open Issue
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="we-footer-bottom">
        <p>&copy; {currentYear} Wind Energy Prediction Dashboard</p>
        <div className="we-footer-links">
          <a href="#privacy">Data use</a>
          <span className="we-divider">|</span>
          <a href="#terms">Forecast caveat</a>
          <span className="we-divider">|</span>
          <a href="#contact">Support</a>
        </div>
      </div>

      <div className="we-footer-meta">
        <article className="we-footer-meta-card" id="privacy">
          <h5>Data use</h5>
          <p>
            This dashboard does not collect personal information and only requests the
            forecast data needed to render the charts.
          </p>
        </article>

        <article className="we-footer-meta-card" id="terms">
          <h5>Forecast caveat</h5>
          <p>
            Forecasts are presented for exploration and comparison. Validate results
            independently before operational use.
          </p>
        </article>

        <article className="we-footer-meta-card" id="contact">
          <h5>Need help?</h5>
          <p>
            Open an issue on GitHub and include the state, model, and any error details so
            the problem is easy to reproduce.
          </p>
          <a href={ISSUES_URL} target="_blank" rel="noreferrer">
            Report an issue
          </a>
        </article>
      </div>
    </footer>
  )
}

export default Footer
