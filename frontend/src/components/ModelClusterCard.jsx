import { useEffect, useRef } from 'react'

function ChevronIcon({ expanded }) {
  return (
    <svg
      aria-hidden="true"
      className={`we-chevron-icon${expanded ? ' is-expanded' : ''}`}
      viewBox="0 0 12 12"
      fill="none"
    >
      <path
        d="M2.25 4.5 6 8.25 9.75 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function formatAccuracyBadge(metric, hasData) {
  if (!hasData) {
    return 'No data'
  }

  if (Number.isFinite(metric?.mape)) {
    return `MAPE ${metric.mape.toFixed(1)}%`
  }

  if (Number.isFinite(metric?.mae)) {
    return `MAE ${metric.mae.toFixed(1)}`
  }

  return 'Awaiting data'
}

function ModelClusterCard({
  familyName,
  family,
  isExpanded,
  modelEnabled,
  modelMetrics,
  availableModels,
  onToggleFamilyExpanded,
  onToggleFamilyEnabled,
  onToggleModelEnabled,
}) {
  const familyCheckboxRef = useRef(null)

  const activeCount = family.models.filter((modelName) => modelEnabled[modelName]).length
  const allEnabled = family.models.length > 0 && activeCount === family.models.length
  const partiallyEnabled = activeCount > 0 && !allEnabled

  useEffect(() => {
    if (familyCheckboxRef.current) {
      familyCheckboxRef.current.indeterminate = partiallyEnabled
    }
  }, [partiallyEnabled])

  return (
    <article className="we-cluster-card" style={{ '--cluster-color': family.color }}>
      <div className="we-cluster-header">
        <div className="we-cluster-title-row">
          <label className="we-cluster-family-toggle">
            <input
              ref={familyCheckboxRef}
              type="checkbox"
              checked={allEnabled}
              onChange={(event) => onToggleFamilyEnabled(familyName, event.target.checked)}
            />
            <span className="we-cluster-swatch" />
            <span className="we-cluster-name">{familyName}</span>
          </label>

          <button
            type="button"
            className="we-cluster-expand-button"
            onClick={() => onToggleFamilyExpanded(familyName)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${familyName}`}
          >
            <span className="we-cluster-mode">
              {isExpanded ? 'Expanded' : `${familyName} (avg)`}
            </span>
            <ChevronIcon expanded={isExpanded} />
          </button>
        </div>

        <div className="we-cluster-caption">
          <span>{activeCount > 0 ? `${activeCount} models enabled` : 'Cluster hidden'}</span>
          <span>{isExpanded ? 'Individual lines' : 'Collapsed family average'}</span>
        </div>
      </div>

      {isExpanded ? (
        <div className="we-cluster-models">
          {family.models.map((modelName) => {
            const hasData = availableModels.has(modelName)

            return (
              <label
                key={modelName}
                className={`we-cluster-model${hasData ? '' : ' is-unavailable'}`}
              >
                <span className="we-cluster-model-main">
                  <input
                    type="checkbox"
                    checked={Boolean(modelEnabled[modelName])}
                    onChange={() => onToggleModelEnabled(modelName)}
                  />
                  <span className="we-cluster-model-name">{modelName}</span>
                </span>
                <span className="we-cluster-badge">
                  {formatAccuracyBadge(modelMetrics[modelName], hasData)}
                </span>
              </label>
            )
          })}
        </div>
      ) : (
        <div className="we-cluster-collapsed-copy">
          Collapsed clusters render one dashed representative forecast line in the family
          color.
        </div>
      )}
    </article>
  )
}

export default ModelClusterCard
