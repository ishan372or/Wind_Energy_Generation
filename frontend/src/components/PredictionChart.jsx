import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function PredictionChart({
  data,
  seriesDefinitions,
  actualLineColor,
  isLoading,
  hasSelection,
  lineWarning,
}) {
  if (!hasSelection) {
    return (
      <div className="we-panel we-panel-empty">
        <p>Enable at least one model family or individual model to see predictions.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="we-panel we-panel-empty">
        <p>Loading predictions...</p>
      </div>
    )
  }

  if (!data || data.length === 0 || seriesDefinitions.length === 0) {
    return (
      <div className="we-panel we-panel-empty">
        <p>No prediction data available for the current selection.</p>
      </div>
    )
  }

  return (
    <div className="we-panel we-chart-panel">
      <div className="we-panel-header">
        <h2 className="we-panel-title">Predicted Wind Energy Generation</h2>
        <p className="we-panel-subtitle">
          Compare actual output with collapsed family averages or expanded model forecasts.
        </p>
      </div>

      {lineWarning && (
        <div className="we-banner we-banner-warning">
          <span>{lineWarning}</span>
        </div>
      )}

      <div className="we-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{
                value: 'MWh',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#64748b' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: '0.5rem',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: '1rem' }} />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Generation"
              stroke={actualLineColor}
              strokeWidth={2.75}
              dot={false}
              activeDot={{ r: 5, fill: '#EA580C' }}
            />
            {seriesDefinitions.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.dataKey}
                name={series.name}
                stroke={series.stroke}
                strokeWidth={series.strokeWidth}
                strokeDasharray={series.strokeDasharray}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PredictionChart
