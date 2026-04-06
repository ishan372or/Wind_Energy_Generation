function ModelSelector({ models, selectedModels, onChange, loading, error }) {
  const handleToggle = (model) => {
    if (selectedModels.includes(model)) {
      onChange(selectedModels.filter((m) => m !== model))
    } else {
      onChange([...selectedModels, model])
    }
  }

  return (
    <div className="we-control-group" id="models">
      <div className="we-label-row">
        <label className="we-label">Models</label>
        {loading && <span className="we-label-hint">Loading models…</span>}
      </div>
      {error && <div className="we-error-text">{error}</div>}
      {!loading && models.length === 0 && !error && (
        <div className="we-muted-text">No models available.</div>
      )}
      <div className="we-model-list">
        {models.map((model) => (
          <label key={model} className="we-model-item">
            <input
              type="checkbox"
              checked={selectedModels.includes(model)}
              onChange={() => handleToggle(model)}
            />
            <span>{model}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default ModelSelector


