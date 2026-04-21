import { Fragment, useMemo } from 'react'

const EMPTY_VALUE = '\u2014'

function formatMetricValue(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : EMPTY_VALUE
}

function normalizeColorToRgb(color) {
  const match = /^#?([0-9a-f]{6})$/i.exec(color ?? '')
  if (!match) {
    return null
  }

  const normalized = match[1]

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ].join(', ')
}

function ModelComparisonTable({ modelMetrics, modelFamilies }) {
  const familySections = useMemo(() => {
    const familyEntries = Object.entries(modelFamilies ?? {})
    const metricsEntries = Object.entries(modelMetrics ?? {})
    const rankedRows = metricsEntries
      .filter(([, metrics]) => Number.isFinite(metrics?.mape))
      .sort((left, right) => left[1].mape - right[1].mape)

    const rankByModel = new Map(
      rankedRows.map(([modelName], index) => [modelName, index + 1]),
    )

    const familyByModel = new Map()
    familyEntries.forEach(([familyName, family]) => {
      ;(family?.models ?? []).forEach((modelName) => {
        familyByModel.set(modelName, familyName)
      })
    })

    const unknownMetricModels = metricsEntries
      .map(([modelName]) => modelName)
      .filter((modelName) => !familyByModel.has(modelName))

    const mergedFamilyEntries = [...familyEntries]
    if (unknownMetricModels.length > 0) {
      mergedFamilyEntries.push([
        'Other Models',
        {
          color: '#64748B',
          models: unknownMetricModels,
          modelLabels: {},
        },
      ])
    }

    return mergedFamilyEntries
      .map(([familyName, family]) => {
        const rows = (family?.models ?? []).map((modelName) => {
          const metrics = modelMetrics?.[modelName]

          return {
            modelName,
            displayName: family?.modelLabels?.[modelName] ?? modelName,
            familyName,
            familyColor: family?.color ?? '#64748B',
            mae: metrics?.mae,
            mape: metrics?.mape,
            rank: rankByModel.get(modelName) ?? null,
          }
        })

        if (rows.length === 0) {
          return null
        }

        const rankedMapes = rows
          .map((row) => row.mape)
          .filter((value) => Number.isFinite(value))
          .sort((left, right) => left - right)

        const bestFamilyMape = rankedMapes[0] ?? Number.POSITIVE_INFINITY

        rows.sort((left, right) => {
          const leftHasMape = Number.isFinite(left.mape)
          const rightHasMape = Number.isFinite(right.mape)

          if (leftHasMape && rightHasMape) {
            return left.mape - right.mape
          }

          if (leftHasMape) {
            return -1
          }

          if (rightHasMape) {
            return 1
          }

          return left.displayName.localeCompare(right.displayName)
        })

        return {
          familyName,
          familyColor: family?.color ?? '#64748B',
          rows,
          bestFamilyMape,
        }
      })
      .filter(Boolean)
      .sort((left, right) => {
        if (left.bestFamilyMape !== right.bestFamilyMape) {
          return left.bestFamilyMape - right.bestFamilyMape
        }

        return left.familyName.localeCompare(right.familyName)
      })
  }, [modelFamilies, modelMetrics])

  const hasMetricData = useMemo(
    () =>
      Object.values(modelMetrics ?? {}).some(
        (metrics) => Number.isFinite(metrics?.mae) || Number.isFinite(metrics?.mape),
      ),
    [modelMetrics],
  )

  const bestRank = 1

  return (
    <section className="we-panel we-comparison-panel">
      <style>{`
        .we-comparison-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .we-comparison-table-wrap {
          overflow-x: auto;
          border-radius: 1.2rem;
          border: 1px solid rgba(189, 169, 142, 0.5);
          background: rgba(255, 252, 247, 0.85);
        }

        .we-comparison-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 680px;
        }

        .we-comparison-table thead th {
          padding: 0.85rem 1rem;
          text-align: left;
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid rgba(189, 169, 142, 0.5);
          background: rgba(255, 250, 243, 0.95);
        }

        .we-comparison-group-row td {
          padding: 0.8rem 1rem;
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--text-dark);
          border-bottom: 1px solid rgba(189, 169, 142, 0.32);
          border-left: 3px solid var(--family-color, #64748b);
          background: linear-gradient(
            90deg,
            rgba(var(--family-rgb, 100, 116, 139), 0.12),
            rgba(255, 250, 243, 0.86)
          );
        }

        .we-comparison-group-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
        }

        .we-comparison-group-dot {
          width: 0.72rem;
          height: 0.72rem;
          border-radius: 999px;
          background: var(--family-color, #64748b);
          box-shadow: 0 0 0 5px rgba(var(--family-rgb, 100, 116, 139), 0.12);
        }

        .we-comparison-table tbody tr:not(.we-comparison-group-row) td {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid rgba(189, 169, 142, 0.26);
          color: var(--text-dark);
          vertical-align: top;
        }

        .we-comparison-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .we-comparison-row.is-best {
          background: rgba(var(--family-rgb, 100, 116, 139), 0.08);
        }

        .we-comparison-model {
          font-weight: 700;
          line-height: 1.4;
        }

        .we-comparison-family {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .we-comparison-rank {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2rem;
          height: 2rem;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.85rem;
          background: rgba(29, 158, 117, 0.1);
          color: var(--text-dark);
        }

        .we-comparison-rank.is-empty {
          background: rgba(224, 216, 201, 0.7);
          color: var(--text-muted);
        }

        .we-comparison-empty {
          padding: 1rem 1.05rem;
        }

        .we-comparison-mobile {
          display: none;
        }

        .we-comparison-card-group {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .we-comparison-card-header {
          padding: 0.85rem 0.95rem;
          border-radius: 1rem;
          border-left: 3px solid var(--family-color, #64748b);
          background: linear-gradient(
            90deg,
            rgba(var(--family-rgb, 100, 116, 139), 0.12),
            rgba(255, 250, 243, 0.86)
          );
          font-weight: 800;
          color: var(--text-dark);
        }

        .we-comparison-card-list {
          display: grid;
          gap: 0.7rem;
        }

        .we-comparison-card {
          padding: 0.95rem;
          border-radius: 1rem;
          border: 1px solid rgba(189, 169, 142, 0.5);
          background: rgba(255, 252, 247, 0.92);
          box-shadow: var(--shadow-card);
        }

        .we-comparison-card.is-best {
          background: rgba(var(--family-rgb, 100, 116, 139), 0.08);
        }

        .we-comparison-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .we-comparison-card-title {
          font-weight: 800;
          color: var(--text-dark);
          line-height: 1.4;
        }

        .we-comparison-card-family {
          margin-top: 0.18rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .we-comparison-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .we-comparison-card-metric {
          display: flex;
          flex-direction: column;
          gap: 0.18rem;
        }

        .we-comparison-card-value {
          font-weight: 800;
          color: var(--text-dark);
        }

        @media (max-width: 768px) {
          .we-comparison-table-wrap {
            display: none;
          }

          .we-comparison-mobile {
            display: grid;
            gap: 0.9rem;
          }
        }
      `}</style>

      <div className="we-panel-header">
        <div>
          <h2 className="we-panel-title">Model comparison</h2>
          <p className="we-panel-subtitle">
            Ranked by mean absolute percentage error so the strongest forecast is easy
            to spot at a glance.
          </p>
        </div>
      </div>

      {!hasMetricData ? (
        <div className="we-banner we-banner-subtle we-comparison-empty">No data</div>
      ) : (
        <>
          <div className="we-comparison-table-wrap">
            <table className="we-comparison-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Family</th>
                  <th>MAPE (%)</th>
                  <th>MAE (MWh)</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                {familySections.map((section) => {
                  const familyRgb = normalizeColorToRgb(section.familyColor)

                  return (
                    <Fragment key={section.familyName}>
                      <tr
                        className="we-comparison-group-row"
                        style={{
                          '--family-color': section.familyColor,
                          '--family-rgb': familyRgb ?? '100, 116, 139',
                        }}
                      >
                        <td colSpan="5">
                          <span className="we-comparison-group-chip">
                            <span className="we-comparison-group-dot" />
                            {section.familyName}
                          </span>
                        </td>
                      </tr>

                      {section.rows.map((row) => (
                        <tr
                          key={row.modelName}
                          className={`we-comparison-row${row.rank === bestRank ? ' is-best' : ''}`}
                          style={{
                            '--family-rgb':
                              normalizeColorToRgb(row.familyColor) ?? '100, 116, 139',
                          }}
                        >
                          <td className="we-comparison-model">{row.displayName}</td>
                          <td className="we-comparison-family">{row.familyName}</td>
                          <td>{formatMetricValue(row.mape)}</td>
                          <td>{formatMetricValue(row.mae)}</td>
                          <td>
                            <span
                              className={`we-comparison-rank${row.rank ? '' : ' is-empty'}`}
                            >
                              {row.rank ?? EMPTY_VALUE}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="we-comparison-mobile">
            {familySections.map((section) => {
              const familyRgb = normalizeColorToRgb(section.familyColor)

              return (
                <div key={section.familyName} className="we-comparison-card-group">
                  <div
                    className="we-comparison-card-header"
                    style={{
                      '--family-color': section.familyColor,
                      '--family-rgb': familyRgb ?? '100, 116, 139',
                    }}
                  >
                    {section.familyName}
                  </div>

                  <div className="we-comparison-card-list">
                    {section.rows.map((row) => (
                      <article
                        key={row.modelName}
                        className={`we-comparison-card${row.rank === bestRank ? ' is-best' : ''}`}
                        style={{
                          '--family-rgb':
                            normalizeColorToRgb(row.familyColor) ?? '100, 116, 139',
                        }}
                      >
                        <div className="we-comparison-card-top">
                          <div>
                            <div className="we-comparison-card-title">{row.displayName}</div>
                            <div className="we-comparison-card-family">{row.familyName}</div>
                          </div>
                          <span
                            className={`we-comparison-rank${row.rank ? '' : ' is-empty'}`}
                          >
                            {row.rank ?? EMPTY_VALUE}
                          </span>
                        </div>

                        <div className="we-comparison-card-grid">
                          <div className="we-comparison-card-metric">
                            <span className="we-label">MAPE (%)</span>
                            <span className="we-comparison-card-value">
                              {formatMetricValue(row.mape)}
                            </span>
                          </div>
                          <div className="we-comparison-card-metric">
                            <span className="we-label">MAE (MWh)</span>
                            <span className="we-comparison-card-value">
                              {formatMetricValue(row.mae)}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export default ModelComparisonTable
