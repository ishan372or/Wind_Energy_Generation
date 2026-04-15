export const DEFAULT_MODEL_FAMILIES = {
  'Gradient Boost': {
    color: '#1D9E75',
    models: ['XGBoost', 'LightGBM', 'CatBoost'],
  },
  'Linear Models': {
    color: '#C96B3B',
    models: ['ElasticNet'],
  },
}

export const STORAGE_KEYS = {
  uiState: 'wind-energy-model-clusters',
}

const DEFAULT_FAMILY_COLORS = ['#1D9E75', '#C96B3B', '#0F6BA8', '#64748B']
const IMPORTED_MODELS_FAMILY = {
  name: 'Imported Models',
  color: '#0F6BA8',
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

export function getAllModels(modelFamilies) {
  return Object.values(modelFamilies).flatMap((family) => family.models)
}

function normalizeModelFamilies(modelFamilies) {
  if (Array.isArray(modelFamilies)) {
    return modelFamilies
      .filter((family) => family && typeof family === 'object' && family.name)
      .map((family, index) => [
        family.name,
        {
          color:
            family.color ||
            DEFAULT_FAMILY_COLORS[index % DEFAULT_FAMILY_COLORS.length],
          models: Array.isArray(family.models) ? family.models.filter(Boolean) : [],
        },
      ])
  }

  return Object.entries(modelFamilies ?? {})
}

export function ensureUiStateIntegrity(modelFamilies, uiState = {}) {
  const nextExpandedFamilies = {}
  const nextModelEnabled = {}

  Object.entries(modelFamilies).forEach(([familyName, family], index) => {
    nextExpandedFamilies[familyName] =
      uiState.expandedFamilies?.[familyName] ?? index === 0

    family.models.forEach((modelName) => {
      nextModelEnabled[modelName] = uiState.modelEnabled?.[modelName] ?? true
    })
  })

  return {
    expandedFamilies: nextExpandedFamilies,
    modelEnabled: nextModelEnabled,
  }
}

export function resolveModelFamilies(availableModels, configuredFamilies = DEFAULT_MODEL_FAMILIES) {
  const availableModelList = Array.isArray(availableModels) ? availableModels : []
  const availableModelSet = new Set(availableModelList)

  const familyEntries = normalizeModelFamilies(configuredFamilies)
    .map(([familyName, family], index) => {
      const familyModels = Array.isArray(family.models) ? family.models : []

      return [
        familyName,
        {
          color:
            family.color ||
            DEFAULT_FAMILY_COLORS[index % DEFAULT_FAMILY_COLORS.length],
          models: Array.from(new Set(familyModels)).filter((modelName) =>
            availableModelSet.has(modelName),
          ),
        },
      ]
    })
    .filter(([, family]) => family.models.length > 0)

  const knownModels = new Set(getAllModels(Object.fromEntries(familyEntries)))
  const unknownModels = availableModelList.filter((modelName) => !knownModels.has(modelName))

  if (unknownModels.length > 0) {
    familyEntries.push([
      IMPORTED_MODELS_FAMILY.name,
      {
        color: IMPORTED_MODELS_FAMILY.color,
        models: Array.from(new Set(unknownModels)),
      },
    ])
  }

  return Object.fromEntries(familyEntries)
}
