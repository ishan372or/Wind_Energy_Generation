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

  const resourceCards = [
    {
      id: 'data',
      title: 'Data Sources',
      description:
        'The dashboard combines wind generation history with weather-driven features so you can compare forecasts against actual values.',
    },
    {
      id: 'api',
      title: 'API Reference',
      description:
        'Use GET /models to list available models and GET /forecast?state=Texas&model=XGBoost to retrieve forecast series.',
    },
    {
      id: 'support',
      title: 'Support',
      description:
        'If a chart looks wrong or a request fails, use the project issue tracker and include the selected state, model, and error message.',
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

        <div className="we-info-resource-block">
          <div className="we-info-header we-info-header-secondary">
            <h2>Resources</h2>
            <p>These sections back the footer links so every shortcut lands on a real destination.</p>
          </div>

          <div className="we-info-grid we-info-resource-grid">
            {resourceCards.map((card) => (
              <article key={card.id} id={card.id} className="we-info-card we-info-resource-card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default InfoSection
