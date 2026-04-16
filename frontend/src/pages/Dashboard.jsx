import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import StateSelector from '../components/StateSelector.jsx'
import ModelSelector from '../components/ModelSelector.jsx'
import PredictionChart from '../components/PredictionChart.jsx'
import InfoSection from '../components/InfoSection.jsx'
import Footer from '../components/Footer.jsx'
import { getModels, getPredictions } from '../api/client.js'
import {
  buildFamilyAverageKey,
  DEFAULT_MODEL_FAMILIES,
  ensureUiStateIntegrity,
  getFamilyPalette,
  MAX_FORECAST_LINES,
  MAX_VISIBLE_LINES,
  MODEL_LINE_PATTERNS,
  resolveModelFamilies,
  STORAGE_KEYS,
} from '../config/modelFamilies.js'
import '../App.css'

const REFRESH_INTERVAL_MS = 3 * 60 * 1000
const ACTUAL_LINE_COLOR = '#B86139'

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : fallback
  } catch {
    return fallback
  }
}

function writeStoredValue(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures and keep the in-memory state.
  }
}

function areObjectsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function getInitialClusterState() {
  return readStoredValue(STORAGE_KEYS.uiState, {
    expandedFamilies: {},
    modelEnabled: {},
  })
}

function buildChartRows(resultsByModel) {
  const rowsByDate = new Map()

  Object.entries(resultsByModel).forEach(([modelName, series]) => {
    series.forEach((point) => {
      const existingRow = rowsByDate.get(point.date) ?? { date: point.date }
      existingRow[modelName] = point.value
      existingRow.actual = point.actual
      rowsByDate.set(point.date, existingRow)
    })
  })

  return Array.from(rowsByDate.values()).sort((left, right) =>
    String(left.date).localeCompare(String(right.date)),
  )
}

function calculateAccuracyMetrics(series) {
  const maeValues = []
  const mapeValues = []

  series.forEach((point) => {
    if (!Number.isFinite(point.value) || !Number.isFinite(point.actual)) {
      return
    }

    const absoluteError = Math.abs(point.value - point.actual)
    maeValues.push(absoluteError)

    if (point.actual !== 0) {
      mapeValues.push((absoluteError / Math.abs(point.actual)) * 100)
    }
  })

  const average = (values) => {
    if (values.length === 0) {
      return null
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  return {
    mae: average(maeValues),
    mape: average(mapeValues),
  }
}

function Dashboard() {
  const [selectedState, setSelectedState] = useState('Texas')

  const [models, setModels] = useState([])
  const [backendModelFamilies, setBackendModelFamilies] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState('')

  const [clusterUiState, setClusterUiState] = useState(getInitialClusterState)

  const [chartData, setChartData] = useState([])
  const [modelMetrics, setModelMetrics] = useState({})
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const [predictionsError, setPredictionsError] = useState('')

  const modelFamilies = useMemo(
    () =>
      resolveModelFamilies(
        models,
        backendModelFamilies.length > 0 ? backendModelFamilies : DEFAULT_MODEL_FAMILIES,
      ),
    [backendModelFamilies, models],
  )

  const { expandedFamilies, modelEnabled } = clusterUiState

  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.uiState, clusterUiState)
  }, [clusterUiState])

  useEffect(() => {
    let cancelled = false

    async function loadModels() {
      try {
        setModelsLoading(true)
        setModelsError('')

        const res = await getModels()
        const modelList = Array.isArray(res.data?.models) ? res.data.models : []
        const familyList = Array.isArray(res.data?.families) ? res.data.families : []

        if (cancelled) {
          return
        }

        setModels(modelList)
        setBackendModelFamilies(familyList)
      } catch (error) {
        if (cancelled) {
          return
        }

        setModelsError(error.message || 'Unable to load models')
        setModels([])
        setBackendModelFamilies([])
      } finally {
        if (!cancelled) {
          setModelsLoading(false)
        }
      }
    }

    loadModels()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setClusterUiState((previousUiState) => {
      const nextUiState = ensureUiStateIntegrity(modelFamilies, previousUiState)
      return areObjectsEqual(previousUiState, nextUiState) ? previousUiState : nextUiState
    })
  }, [modelFamilies])

  const loadPredictions = useCallback(async () => {
    if (!selectedState || models.length === 0) {
      setChartData([])
      setModelMetrics({})
      setPredictionsError('')
      return
    }

    setPredictionsLoading(true)
    setPredictionsError('')

    try {
      const settledResults = await Promise.allSettled(
        models.map(async (modelName) => {
          const res = await getPredictions(selectedState, modelName)
          return {
            modelName,
            series: Array.isArray(res.data) ? res.data : res.data?.predictions ?? [],
          }
        }),
      )

      const failedModels = []
      const resultsByModel = {}
      const metricsByModel = {}

      settledResults.forEach((result, index) => {
        const modelName = models[index]

        if (result.status === 'fulfilled') {
          resultsByModel[modelName] = result.value.series
          metricsByModel[modelName] = calculateAccuracyMetrics(result.value.series)
          return
        }

        failedModels.push(modelName)
      })

      setChartData(buildChartRows(resultsByModel))
      setModelMetrics(metricsByModel)

      if (failedModels.length === models.length) {
        setPredictionsError('Unable to load predictions for the current state.')
      } else if (failedModels.length > 0) {
        setPredictionsError(`Some model series could not be loaded: ${failedModels.join(', ')}`)
      } else {
        setPredictionsError('')
      }
    } catch (error) {
      setPredictionsError(error.message || 'Unable to load predictions')
      setChartData([])
      setModelMetrics({})
    } finally {
      setPredictionsLoading(false)
    }
  }, [models, selectedState])

  useEffect(() => {
    loadPredictions()
  }, [loadPredictions])

  useEffect(() => {
    if (!selectedState || models.length === 0) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      loadPredictions()
    }, REFRESH_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [loadPredictions, models.length, selectedState])

  const displayedChartData = useMemo(() => {
    if (chartData.length === 0) {
      return chartData
    }

    return chartData.map((row) => {
      const nextRow = { ...row }

      Object.entries(modelFamilies).forEach(([familyName, family]) => {
        const enabledModels = family.models.filter((modelName) => modelEnabled[modelName])
        const numericValues = enabledModels
          .map((modelName) => row[modelName])
          .filter((value) => Number.isFinite(value))

        nextRow[buildFamilyAverageKey(familyName)] =
          numericValues.length > 0
            ? Number(
                (
                  numericValues.reduce((sum, value) => sum + value, 0) /
                  numericValues.length
                ).toFixed(2),
              )
            : null
      })

      return nextRow
    })
  }, [chartData, modelEnabled, modelFamilies])

  const enabledModelCount = useMemo(
    () => Object.values(modelEnabled).filter(Boolean).length,
    [modelEnabled],
  )

  const desiredSeriesDefinitions = useMemo(() => {
    if (chartData.length === 0) {
      return []
    }

    const dataAvailableForModel = (modelName) =>
      chartData.some((row) => Number.isFinite(row[modelName]))

    return Object.entries(modelFamilies).flatMap(([familyName, family]) => {
      const enabledModels = family.models.filter(
        (modelName) => modelEnabled[modelName] && dataAvailableForModel(modelName),
      )

      if (enabledModels.length === 0) {
        return []
      }

      if (!expandedFamilies[familyName]) {
        return [
          {
            key: `family:${familyName}`,
            dataKey: buildFamilyAverageKey(familyName),
            name: `${familyName} (avg)`,
            stroke: family.color,
            strokeWidth: 2.25,
            strokeDasharray: '10 6',
          },
        ]
      }

      const palette = getFamilyPalette(family.color, enabledModels.length)

      return enabledModels.map((modelName, index) => {
        const dashPattern = MODEL_LINE_PATTERNS[index % MODEL_LINE_PATTERNS.length]

        return {
          key: `model:${modelName}`,
          dataKey: modelName,
          name: `${modelName} (Predicted)`,
          stroke: palette[index],
          strokeWidth: 2,
          strokeDasharray: dashPattern === '0' ? undefined : dashPattern,
        }
      })
    })
  }, [chartData, expandedFamilies, modelEnabled, modelFamilies])

  const visibleSeriesDefinitions = useMemo(
    () => desiredSeriesDefinitions.slice(0, MAX_FORECAST_LINES),
    [desiredSeriesDefinitions],
  )

  const hiddenSeriesCount = Math.max(
    0,
    desiredSeriesDefinitions.length - visibleSeriesDefinitions.length,
  )

  const hasSelection = enabledModelCount > 0

  const lineWarning = hiddenSeriesCount
    ? `Chart is capped at ${MAX_VISIBLE_LINES} visible lines. Showing ${MAX_FORECAST_LINES} forecast lines plus Actual Generation while ${hiddenSeriesCount} more forecast lines stay hidden.`
    : ''

  const stateSummary = useMemo(() => {
    if (!selectedState || displayedChartData.length === 0) {
      return ''
    }

    return `${displayedChartData.length} time points loaded | ${visibleSeriesDefinitions.length} forecast line${
      visibleSeriesDefinitions.length === 1 ? '' : 's'
    } visible`
  }, [displayedChartData.length, selectedState, visibleSeriesDefinitions.length])

  const availableModelsSet = useMemo(() => new Set(models), [models])

  const handleToggleFamilyExpanded = useCallback((familyName) => {
    setClusterUiState((previousState) => ({
      ...previousState,
      expandedFamilies: {
        ...previousState.expandedFamilies,
        [familyName]: !previousState.expandedFamilies[familyName],
      },
    }))
  }, [])

  const handleToggleFamilyEnabled = useCallback(
    (familyName, shouldEnable) => {
      const familyModels = modelFamilies[familyName]?.models ?? []

      setClusterUiState((previousState) => {
        const nextModelEnabled = { ...previousState.modelEnabled }
        familyModels.forEach((modelName) => {
          nextModelEnabled[modelName] = shouldEnable
        })

        return {
          ...previousState,
          modelEnabled: nextModelEnabled,
        }
      })
    },
    [modelFamilies],
  )

  const handleToggleModelEnabled = useCallback((modelName) => {
    setClusterUiState((previousState) => ({
      ...previousState,
      modelEnabled: {
        ...previousState.modelEnabled,
        [modelName]: !previousState.modelEnabled[modelName],
      },
    }))
  }, [])

  return (
    <>
      <Header />
      <div className="we-app" id="dashboard">
        <main className="we-main">
          <section className="we-toolbar">
            <StateSelector value={selectedState} onChange={setSelectedState} />
            {stateSummary && (
              <div className="we-banner we-banner-subtle we-toolbar-summary">
                <span className="we-summary-label">{selectedState}</span>
                <span className="we-summary-copy">{stateSummary}</span>
              </div>
            )}
          </section>

          {predictionsError && (
            <div className="we-banner we-banner-error">
              <span>{predictionsError}</span>
            </div>
          )}

          <section className="we-dashboard-shell">
            <aside className="we-sidebar">
              <ModelSelector
                modelFamilies={modelFamilies}
                expandedFamilies={expandedFamilies}
                modelEnabled={modelEnabled}
                modelMetrics={modelMetrics}
                availableModels={availableModelsSet}
                loading={modelsLoading}
                error={modelsError}
                onToggleFamilyExpanded={handleToggleFamilyExpanded}
                onToggleFamilyEnabled={handleToggleFamilyEnabled}
                onToggleModelEnabled={handleToggleModelEnabled}
              />
            </aside>

            <section className="we-main-content">
              <PredictionChart
                data={displayedChartData}
                seriesDefinitions={visibleSeriesDefinitions}
                actualLineColor={ACTUAL_LINE_COLOR}
                isLoading={predictionsLoading}
                hasSelection={hasSelection}
                lineWarning={lineWarning}
              />
            </section>
          </section>
        </main>
      </div>
      <InfoSection />
      <Footer />
    </>
  )
}

export default Dashboard
