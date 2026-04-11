import './InfoSection.css'

function InfoSection() {
  const infoCards = [
    {
      title: 'Real-Time Forecasting',
      description:
        'Advanced ML models predict wind energy generation with high accuracy, enabling better grid management and resource planning.',
    },
    {
      title: 'Top 10 States',
      description:
        'Monitor wind energy production across the leading wind-generating states in the United States.',
    },
    {
      title: 'Multiple Models',
      description:
        'Compare predictions from different ML models to gain confidence in forecasts and validate predictions.',
    },
    {
      title: 'Data-Driven Insights',
      description:
        'Leverage historical wind and weather data to understand patterns and optimize energy distribution.',
    },
  ]

  return (
    <section className="we-info-section" id="documentation">
      <div className="we-info-container">
        <div className="we-info-header">
          <h2>About This Dashboard</h2>
          <p>
            Harness the power of machine learning to understand and predict wind energy generation patterns
          </p>
        </div>

        <div className="we-info-grid">
          {infoCards.map((card) => (
            <div key={card.title} className="we-info-card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default InfoSection
