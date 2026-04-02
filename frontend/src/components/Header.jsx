import './Header.css'

function Header() {
  return (
    <header className="we-header">
      <div className="we-header-main">
        <h1 className="we-header-title">Wind Energy Prediction Dashboard</h1>
        <p className="we-header-subtitle">
          Explore model-driven forecasts of wind energy generation across top U.S. wind states.
        </p>
      </div>
    </header>
  )
}

export default Header


