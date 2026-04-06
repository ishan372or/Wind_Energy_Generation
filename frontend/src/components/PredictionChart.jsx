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

const COLORS = [
  '#0f766e',
  '#2563eb',
  '#f59e0b',
  '#7c3aed',
  '#ef4444',
  '#10b981',
  '#0891b2',
  '#a16207',
]

function PredictionChart({ data, selectedModels, isLoading, hasSelection }) {
  if (!hasSelection) {
    return (
      <div className="we-panel we-panel-empty">
        <p>Select at least one model to see predictions.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="we-panel we-panel-empty">
        <p>Loading predictions…</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
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
        <p className="we-panel-subtitle">Time-series forecast by model</p>
      </div>
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
                border: '1px solid rgba(20, 184, 166, 0.3)',
                borderRadius: '0.5rem',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: '1rem' }} />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Generation"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#059669' }}
            />
            {selectedModels.map((model, index) => (
              <Line
                key={model}
                type="monotone"
                dataKey={model}
                name={`${model} (Predicted)`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                strokeDasharray="5 5"
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


