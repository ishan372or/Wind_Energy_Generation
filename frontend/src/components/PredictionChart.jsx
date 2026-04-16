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
        <p>Select at least one model family or model to draw forecast lines.</p>
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
        <p>No prediction data is available for this state and model selection.</p>
      </div>
    )
  }

  return (
    <div className="we-panel we-chart-panel">
      <div className="we-panel-header">
        <h2 className="we-panel-title">Monthly wind generation</h2>
        <p className="we-panel-subtitle">
          Actual generation stays on the chart while enabled families or models layer on
          top for comparison.
        </p>
      </div>

      {lineWarning && (
        <div className="we-banner we-banner-warning">
          <span>{lineWarning}</span>
        </div>
      )}

      <div className="we-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 18, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid
              stroke="#ccbda8"
              strokeDasharray="2 7"
              vertical={false}
              opacity={0.55}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#655f55' }}
              tickLine={false}
              axisLine={{ stroke: '#bda98e' }}
              tickMargin={10}
            />
            <YAxis
              width={72}
              tick={{ fontSize: 11, fill: '#655f55' }}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'MWh',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#655f55' },
              }}
            />
            <Tooltip
              cursor={{ stroke: '#7f7668', strokeDasharray: '4 6', opacity: 0.45 }}
              contentStyle={{
                backgroundColor: 'rgba(255, 250, 243, 0.98)',
                border: '1px solid rgba(189, 169, 142, 0.9)',
                borderRadius: '0.85rem',
                color: '#1f2933',
                boxShadow: '0 14px 26px rgba(70, 53, 35, 0.12)',
              }}
              labelStyle={{ color: '#655f55', fontWeight: 700, marginBottom: '0.35rem' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: '1rem', color: '#655f55' }} />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Generation"
              stroke={actualLineColor}
              strokeWidth={2.75}
              dot={false}
              activeDot={{ r: 5, fill: '#8f4422' }}
              strokeLinecap="round"
              strokeLinejoin="round"
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
                activeDot={{ r: 4.5, strokeWidth: 0 }}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PredictionChart
