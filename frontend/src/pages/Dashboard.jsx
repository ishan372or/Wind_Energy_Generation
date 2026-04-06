import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import StateSelector from '../components/StateSelector.jsx'
import ModelSelector from '../components/ModelSelector.jsx'
import PredictionChart from '../components/PredictionChart.jsx'
import InfoSection from '../components/InfoSection.jsx'
import Footer from '../components/Footer.jsx'
import { getModels, getPredictions } from '../api/client.js'
import '../App.css'

const REFRESH_INTERVAL_MS = 3 * 60 * 1000 // every 3 minutes

function Dashboard() {
  const [selectedState, setSelectedState] = useState('Texas')

  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState('')

  const [selectedModels, setSelectedModels] = useState([])

  const [chartData, setChartData] = useState([])
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const [predictionsError, setPredictionsError] = useState('')

  // Load available models on first render
  useEffect(() => {
    let cancelled = false

    async function loadModels() {
      try {
        setModelsLoading(true)
        setModelsError('')
        const res = await getModels()
        const modelList = Array.isArray(res.data)
          ? res.data
          : res.data?.models ?? []

        setModels(modelList)
        setSelectedModels(modelList)
      } catch (error) {
        if (cancelled) return
        setModelsError(error.message || 'Unable to load models')
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

  const hasModelSelection = selectedModels.length > 0

  const loadPredictions = useCallback(async () => {
    if (!selectedState || selectedModels.length === 0) {
      setChartData([])
      return
    }

    setPredictionsLoading(true)
    setPredictionsError('')

    try {
      const results = await Promise.all(
        selectedModels.map(async (model) => {
          const res = await getPredictions(selectedState, model)
          return Array.isArray(res.data)
            ? res.data
            : res.data?.predictions ?? []
        }),
      )

      const byDate = new Map()

      results.forEach((series, index) => {
        const modelName = selectedModels[index]
        series.forEach((point) => {
          const existing = byDate.get(point.date) ?? { date: point.date }
          existing[modelName] = point.value
          existing.actual = point.actual
          byDate.set(point.date, existing)
        })
      })

      const combined = Array.from(byDate.values()).sort((a, b) =>
        String(a.date).localeCompare(String(b.date)),
      )

      setChartData(combined)
    } catch (error) {
      setPredictionsError(error.message || 'Unable to load predictions')
      setChartData([])
    } finally {
      setPredictionsLoading(false)
    }
  }, [selectedState, selectedModels])

  useEffect(() => {
    loadPredictions()
  }, [loadPredictions])

  useEffect(() => {
    if (!selectedState || selectedModels.length === 0) return

    const intervalId = setInterval(() => {
      loadPredictions()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [selectedState, selectedModels, loadPredictions])

  const stateSummary = useMemo(() => {
    if (!selectedState) return ''
    const count = chartData.length
    if (!count) return ''
    return `${count} time points loaded`
  }, [chartData, selectedState])

  return (
    <>
      <Header />
      <div className="we-app">
        <main className="we-main">
          <section className="we-controls-row">
            <StateSelector value={selectedState} onChange={setSelectedState} />
            <ModelSelector
              models={models}
              selectedModels={selectedModels}
              onChange={setSelectedModels}
              loading={modelsLoading}
              error={modelsError}
            />
          </section>

          {predictionsError && (
            <div className="we-banner we-banner-error">
              <span>{predictionsError}</span>
            </div>
          )}

          {stateSummary && (
            <div className="we-banner we-banner-subtle">
              <span>{stateSummary}</span>
            </div>
          )}

          <section className="we-main-content">
            <PredictionChart
              data={chartData}
              selectedModels={selectedModels}
              isLoading={predictionsLoading}
              hasSelection={hasModelSelection}
            />
          </section>
        </main>
      </div>
      <InfoSection />
      <Footer />
    </>
  )
}

export default Dashboard


