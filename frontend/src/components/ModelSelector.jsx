import { useEffect, useMemo, useState } from 'react'
import ModelClusterCard from './ModelClusterCard.jsx'

function ModelSelector({
  modelFamilies,
  expandedFamilies,
  modelEnabled,
  modelMetrics,
  availableModels,
  loading,
  error,
  onToggleFamilyExpanded,
  onToggleFamilyEnabled,
  onToggleModelEnabled,
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const familyEntries = useMemo(() => Object.entries(modelFamilies), [modelFamilies])
  const enabledCount = useMemo(
    () => Object.values(modelEnabled).filter(Boolean).length,
    [modelEnabled],
  )

  useEffect(() => {
    if (!isSheetOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSheetOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isSheetOpen) {
        setIsSheetOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSheetOpen])

  const panelBody = (
    <>
      <div className="we-model-panel-header">
        <div>
          <h2 className="we-panel-title">Model families</h2>
          <p className="we-panel-subtitle">
            Collapse a family for the broader signal, or expand it to compare model
            behavior line by line.
          </p>
        </div>
        <div className="we-model-panel-summary">
          <span>{enabledCount} enabled</span>
          {loading && <span className="we-label-hint">Refreshing list...</span>}
        </div>
      </div>

      {error && <div className="we-error-text">{error}</div>}

      {!loading && familyEntries.length === 0 && !error && (
        <div className="we-muted-text">No model families available.</div>
      )}

      <div className="we-cluster-stack">
        {familyEntries.map(([familyName, family]) => (
          <ModelClusterCard
            key={familyName}
            familyName={familyName}
            family={family}
            isExpanded={Boolean(expandedFamilies[familyName])}
            modelEnabled={modelEnabled}
            modelMetrics={modelMetrics}
            availableModels={availableModels}
            onToggleFamilyExpanded={onToggleFamilyExpanded}
            onToggleFamilyEnabled={onToggleFamilyEnabled}
            onToggleModelEnabled={onToggleModelEnabled}
          />
        ))}
      </div>
    </>
  )

  return (
    <>
      <div className="we-model-selector" id="models">
        <div className="we-mobile-model-bar">
          <div className="we-mobile-model-copy">
            <span className="we-label">Model families</span>
            <span className="we-label-hint">{enabledCount} enabled</span>
          </div>
          <button
            type="button"
            className="we-mobile-sheet-button"
            onClick={() => setIsSheetOpen(true)}
          >
            Choose models
          </button>
        </div>

        <div className="we-panel we-model-panel">{panelBody}</div>
      </div>

      {isSheetOpen && (
        <div className="we-sheet-backdrop" role="presentation" onClick={() => setIsSheetOpen(false)}>
          <div
            className="we-model-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-model-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="we-sheet-handle" />
            <div className="we-sheet-header">
              <h2 id="mobile-model-sheet-title" className="we-panel-title">
                Model families
              </h2>
              <button
                type="button"
                className="we-modal-close"
                onClick={() => setIsSheetOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="we-sheet-content">{panelBody}</div>
          </div>
        </div>
      )}
    </>
  )
}

export default ModelSelector
