const AVOIDABLE_BOOLEAN_NAMES = new Set([
  'LyonSuspicious',
  'DrifterLiar',
  'RoatheInsulted',
])

const FLIRTING_BOOLEAN_KEYWORDS = ['Flirt', 'Dating', 'NoFlirt', 'NoDate']

// Exact names for flirting-related booleans that do not follow keyword patterns.
const FLIRTING_BOOLEAN_EXACT_NAMES = new Set(
  ['QuincyFlirtNo', 'ArthurConfessedFeels', 'LettieConfession', 'DrifterMarie'].map((name) =>
    name.toLowerCase()
  )
)

export function isFlirtingBoolean(booleanName: string): boolean {
  const normalizedName = booleanName.trim().toLowerCase()
  if (!normalizedName) {
    return false
  }

  if (FLIRTING_BOOLEAN_EXACT_NAMES.has(normalizedName)) {
    return true
  }

  return FLIRTING_BOOLEAN_KEYWORDS.some((keyword) =>
    normalizedName.includes(keyword.toLowerCase())
  )
}

export function isAvoidableBoolean(booleanName: string): boolean {
  return AVOIDABLE_BOOLEAN_NAMES.has(booleanName.trim())
}

export function getFlirtingBooleanSignature(
  booleanMutations: Record<string, boolean>
): string {
  // Get all flirting boolean names that appear in mutations
  const flirtingNames = Object.keys(booleanMutations).filter((name) =>
    isFlirtingBoolean(name)
  )

  if (flirtingNames.length === 0) {
    return 'no-flirting'
  }

  // Return a signature of which flirting booleans are explicitly set
  // This prevents paths with different flirting decisions from merging
  return 'flirting:' + flirtingNames.sort().join('|')
}
