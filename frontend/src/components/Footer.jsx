import './Footer.css'

const REPO_URL = 'https://github.com/ishan372or/Wind_Energy_Generation'
const ISSUES_URL = `${REPO_URL}/issues`

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="we-footer">
      <div className="we-footer-content">
        <div className="we-footer-section">
          <h4>Wind Energy Dashboard</h4>
          <p>Advanced ML-driven forecasting for renewable energy generation across the United States.</p>
        </div>

        <div className="we-footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="#dashboard">Dashboard</a>
            </li>
            <li>
              <a href="#models">Models</a>
            </li>
            <li>
              <a href="#data">Data Sources</a>
            </li>
          </ul>
        </div>

        <div className="we-footer-section">
          <h4>Resources</h4>
          <ul>
            <li>
              <a href="#documentation">Documentation</a>
            </li>
            <li>
              <a href="#api">API Reference</a>
            </li>
            <li>
              <a href="#support">Support</a>
            </li>
          </ul>
        </div>

        <div className="we-footer-section">
          <h4>Connect</h4>
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
        <p>&copy; {currentYear} Wind Energy Prediction Dashboard. All rights reserved.</p>
        <div className="we-footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span className="we-divider">|</span>
          <a href="#terms">Terms of Service</a>
          <span className="we-divider">|</span>
          <a href="#contact">Contact</a>
        </div>
      </div>

      <div className="we-footer-meta">
        <article className="we-footer-meta-card" id="privacy">
          <h5>Privacy Policy</h5>
          <p>This dashboard UI does not ask users for personal information and only requests forecast data needed to render charts.</p>
        </article>

        <article className="we-footer-meta-card" id="terms">
          <h5>Terms of Service</h5>
          <p>Forecasts are provided for exploration and comparison. Validate results independently before operational use.</p>
        </article>

        <article className="we-footer-meta-card" id="contact">
          <h5>Contact</h5>
          <p>
            Need help with the dashboard or API? Open an issue on GitHub and include the state, model, and any error details.
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
