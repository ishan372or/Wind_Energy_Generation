const API_BASE_PATH = import.meta.env.VITE_API_URL || '/api'

export async function getModels() {
  const response = await fetch(`${API_BASE_PATH}/models`)
  if (!response.ok) {
    throw new Error('Failed to load models')
  }
  const data = await response.json()
  return {data: data.models}
}

export async function getPredictions(state, model) {
  const params = new URLSearchParams({ state, model })
  const response = await fetch(`${API_BASE_PATH}/forecast?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Failed to load predictions for model ${model}`)
  }

  const json = await response.json()

  return {
    data: json.data.map(point => ({    
      date:   point.month,
      value:  point.predicted,
      actual: point.actual
    }))
  }
}


