export const CHATROOMS = [
  'aoi',
  'arthur',
  'eleanor',
  'flare',
  'hex',
  'amir',
  'kaya',
  'lettie',
  'loid',
  'lyon',
  'marie',
  'minerva',
  'minerva-velimir',
  'quincy',
  'roathe',
  'velimir',
] as const

export const AVOIDABLE_BOOLEAN_NAMES = new Set([
  'LyonSuspicious',
  'DrifterLiar',
  'RoatheInsulted',
])

// Exact names for flirting-related booleans that do not follow keyword patterns.
export const ROMANCE_BOOLEAN_NAMES = [
  'ArthurConfessedFeels',
  'LettieConfession',
  'DrifterMarie',
]

export const NO_ROMANCE_BOOLEAN_NAMES = ['QuincyFlirtNo']
