export const DEFAULT_MODEL_FAMILIES = {
  'Gradient Boost': {
    color: '#1D9E75',
    models: ['XGBoost', 'LightGBM', 'CatBoost'],
  },
  'Deep Learning': {
    color: '#534AB7',
    models: ['LSTM', 'Transformer'],
  },
  Statistical: {
    color: '#888780',
    models: ['ARIMA', 'Prophet'],
  },
}

export const STORAGE_KEYS = {
  uiState: 'wind-energy-model-clusters',
}

export const DEFAULT_CLUSTER_UI_STATE = {
  expandedFamilies: {
    'Gradient Boost': true,
    'Deep Learning': false,
    Statistical: false,
  },
  modelEnabled: {
    XGBoost: true,
    LightGBM: true,
    CatBoost: true,
    LSTM: false,
    Transformer: false,
    ARIMA: false,
    Prophet: false,
  },
}

export const MODEL_LINE_PATTERNS = ['0', '8 5', '2 6', '10 4 2 4']

export const MAX_VISIBLE_LINES = 8
export const MAX_FORECAST_LINES = MAX_VISIBLE_LINES - 1

export function slugifyFamilyName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function buildFamilyAverageKey(name) {
  return `family_avg__${slugifyFamilyName(name)}`
}

export function mixHexColor(color, amount) {
  if (!/^#([0-9a-f]{6})$/i.test(color)) {
    return color
  }

  const normalized = color.slice(1)
  const channelValues = [0, 2, 4].map((offset) =>
    Number.parseInt(normalized.slice(offset, offset + 2), 16),
  )

  const mixed = channelValues
    .map((channel) => {
      const target = amount >= 0 ? 255 : 0
      const next = Math.round(channel + (target - channel) * Math.abs(amount))
      return Math.max(0, Math.min(255, next)).toString(16).padStart(2, '0')
    })
    .join('')

  return `#${mixed}`
}

export function getFamilyPalette(baseColor, count) {
  if (count <= 1) {
    return [baseColor]
  }

  const offsets = [-0.18, -0.08, 0, 0.16, 0.3, 0.42]
  return Array.from({ length: count }, (_, index) => {
    const offset = offsets[index] ?? Math.min(0.52, 0.18 + index * 0.08)
    return mixHexColor(baseColor, offset)
  })
}

export function getDefaultExpandedFamilies() {
  return { ...DEFAULT_CLUSTER_UI_STATE.expandedFamilies }
}

export function getDefaultModelEnabled() {
  return { ...DEFAULT_CLUSTER_UI_STATE.modelEnabled }
}

export function getAllModels(modelFamilies) {
  return Object.values(modelFamilies).flatMap((family) => family.models)
}

export function ensureUiStateIntegrity(modelFamilies, uiState) {
  const nextExpandedFamilies = { ...getDefaultExpandedFamilies(), ...uiState.expandedFamilies }
  const nextModelEnabled = { ...getDefaultModelEnabled(), ...uiState.modelEnabled }

  Object.keys(modelFamilies).forEach((familyName) => {
    if (!(familyName in nextExpandedFamilies)) {
      nextExpandedFamilies[familyName] = false
    }

    modelFamilies[familyName].models.forEach((modelName) => {
      if (!(modelName in nextModelEnabled)) {
        nextModelEnabled[modelName] = false
      }
    })
  })

  return {
    expandedFamilies: nextExpandedFamilies,
    modelEnabled: nextModelEnabled,
  }
}

export function ensureModelFamiliesContainModels(modelFamilies, availableModels) {
  const familyEntries = Object.entries(modelFamilies)
  const knownModels = new Set(getAllModels(modelFamilies))
  const missingModels = availableModels.filter((model) => !knownModels.has(model))

  if (missingModels.length === 0) {
    return modelFamilies
  }

  const nextFamilies = { ...modelFamilies }
  const fallbackFamilyName = 'Imported Models'

  if (!nextFamilies[fallbackFamilyName]) {
    nextFamilies[fallbackFamilyName] = {
      color: '#0F6BA8',
      models: [],
    }
  }

  const mergedModels = new Set(nextFamilies[fallbackFamilyName].models)
  missingModels.forEach((model) => mergedModels.add(model))

  nextFamilies[fallbackFamilyName] = {
    ...nextFamilies[fallbackFamilyName],
    models: Array.from(mergedModels),
  }

  return Object.fromEntries([
    ...familyEntries,
    [fallbackFamilyName, nextFamilies[fallbackFamilyName]],
  ])
}
