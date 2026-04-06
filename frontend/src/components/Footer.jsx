import './Footer.css'

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
              <a href="#">GitHub</a>
            </li>
            <li>
              <a href="#">Twitter</a>
            </li>
            <li>
              <a href="#">LinkedIn</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="we-footer-bottom">
        <p>&copy; {currentYear} Wind Energy Prediction Dashboard. All rights reserved.</p>
        <div className="we-footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span className="we-divider">•</span>
          <a href="#terms">Terms of Service</a>
          <span className="we-divider">•</span>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
