import { Node } from '.'

/** Simulation initial state and configuration options */
export type TraversalOptions = {
  initialState?: SimulationState
}

/**
 * A single path through the dialogue graph,
 * including the final state and tracking information about interactions.
 */
export type DialoguePath = {
  /** The nodes in the path */
  nodes: Node[]
  /** The final state of the simulation */
  finalState: SimulationState
  /**
   * Whether the path is uncertain.
   * A path is considered uncertain if it includes any CheckBooleanScript nodes,
   * since we don't evaluate their conditions in this simulation.
   * This means that for uncertain paths,
   * we can't be sure which branches were actually taken at those nodes,
   * so the path represents one of multiple possible outcomes.
   * */
  isUncertain: boolean
  /** Tracking information for checks */
  checks: {
    /** Names of booleans checked */
    booleans: string[]
    /** Names of counters checked */
    counters: string[]
  }
  /** Tracking information for mutations */
  mutations: {
    /** Names of booleans set to true */
    set: string[]
    /** Names of booleans set to false */
    reset: string[]
    /**
     * Amounts each counter was incremented by.
     * The amount can be negative if the counter was decremented.
     */
    increments: Record<string, number>
  }
}

/** User-defined state of the simulation */
export type SimulationState = {
  /** A record of boolean values */
  booleans: Record<string, boolean>
  /** A record of counter values */
  counters: Record<string, number>
}

export type HydratedDataOptions = {
  locale?: string
}

export type PathOptimizationOptions = {
  avoidableBooleans: string[] // Booleans that make a path "worse"
  positiveRomanceBooleans: string[] // Booleans indicating successful romance
  negativeRomanceBooleans: string[] // Booleans indicating romance failure
}

export type OptimizedResults = {
  bestGeneral: DialoguePath[] // Highest count of non-romance, non-avoidable booleans
  bestCounterGains: DialoguePath[] // Highest total sum of counter increments
  bestPositiveRomance: DialoguePath[]
  bestNegativeRomance: DialoguePath[]
}
