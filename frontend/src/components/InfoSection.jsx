import './InfoSection.css'

function InfoSection() {
  const infoCards = [
    {
      title: 'Start with the state picker',
      description:
        'Choose a wind-heavy state to keep the chart focused. The view updates with actual generation and the enabled forecast lines.',
    },
    {
      title: 'Collapse for the broader signal',
      description:
        'Keep families collapsed when you want the cleaner read. Each family becomes one dashed line that represents the group.',
    },
    {
      title: 'Expand for model-by-model behavior',
      description:
        'Open a family when you want to inspect how individual models separate, converge, or drift through the same months.',
    },
    {
      title: 'Read forecasts against reality',
      description:
        'The actual generation line stays visible so it is easier to judge seasonal fit, missed peaks, and spread between models.',
    },
  ]

  return (
    <section className="we-info-section" id="documentation">
      <div className="we-info-container">
        <div className="we-info-header">
          <span className="we-info-eyebrow">Reading notes</span>
          <h2>Use the dashboard like a field guide, not a control panel.</h2>
          <p>
            Start with a state, narrow the model families, and read the chart from actual
            output outward.
          </p>
        </div>

        <div className="we-info-grid">
          {infoCards.map((card, index) => (
            <article key={card.title} className="we-info-card">
              <span className="we-info-card-index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default InfoSection
