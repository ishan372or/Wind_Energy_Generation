const TOP_WIND_STATES = [
  { code: 'TX', name: 'Texas' },
  { code: 'IA', name: 'Iowa' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'KS', name: 'Kansas' },
  { code: 'IL', name: 'Illinois' },
  { code: 'CA', name: 'California' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'CO', name: 'Colorado' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'WA', name: 'Washington' },
]

function StateSelector({ value, onChange }) {
  return (
    <div className="we-control-group">
      <label htmlFor="state-select" className="we-label">
        State
      </label>
      <select
        id="state-select"
        className="we-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {TOP_WIND_STATES.map((state) => (
          <option key={state.name} value={state.name}>
            {state.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default StateSelector


