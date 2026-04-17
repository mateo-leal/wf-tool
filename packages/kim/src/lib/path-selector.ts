import {
  DialoguePath,
  OptimizedResults,
  PathOptimizationOptions,
} from '../types/internal'
import {
  AVOIDABLE_BOOLEAN_NAMES,
  NO_ROMANCE_BOOLEAN_NAMES,
  ROMANCE_BOOLEAN_NAMES,
} from './constants'

export class PathSelector {
  static getChecks(paths: DialoguePath[]) {
    return paths.reduce(
      (acc, path) => {
        return {
          booleans: Array.from(
            new Set([...acc.booleans, ...path.checks.booleans])
          ),
          counters: Array.from(
            new Set([...acc.counters, ...path.checks.counters])
          ),
        }
      },
      { booleans: [], counters: [] } as {
        booleans: string[]
        counters: string[]
      }
    )
  }

  static selectBestPaths(
    paths: DialoguePath[],
    options?: PathOptimizationOptions
  ) {
    const finalOptions: PathOptimizationOptions = {
      avoidableBooleans: [
        ...(options?.avoidableBooleans ?? []),
        ...AVOIDABLE_BOOLEAN_NAMES,
      ],
      positiveRomanceBooleans: [
        ...(options?.avoidableBooleans ?? []),
        ...ROMANCE_BOOLEAN_NAMES,
      ],
      negativeRomanceBooleans: [
        ...(options?.avoidableBooleans ?? []),
        ...NO_ROMANCE_BOOLEAN_NAMES,
      ],
    }
    // Tracking Variables for "Best" scores
    let maxGeneralBooleans = -1
    let maxCounterSum = -1
    let maxPosRomance = -1
    let maxNegRomance = -1

    const results: OptimizedResults = {
      bestGeneral: [],
      bestCounterGains: [],
      bestPositiveRomance: [],
      bestNegativeRomance: [],
    }

    for (const path of paths) {
      // 1. Calculate Scores
      const avoidableCount = path.mutations.set.filter((b) =>
        finalOptions.avoidableBooleans.includes(b)
      ).length

      // If a path hits an "avoidable" boolean, we can either disqualify it
      // or just lower its priority. Here we prioritize paths with 0 avoidables.
      if (avoidableCount > 0) continue

      // General Booleans (Set booleans that aren't romance or avoidable)
      const generalCount = path.mutations.set.filter(
        (b) =>
          !finalOptions.positiveRomanceBooleans.includes(b) &&
          !finalOptions.negativeRomanceBooleans.includes(b)
      ).length

      const posRomanceCount = path.mutations.set.filter((b) =>
        finalOptions.positiveRomanceBooleans.includes(b)
      ).length
      const negRomanceCount = path.mutations.set.filter((b) =>
        finalOptions.negativeRomanceBooleans.includes(b)
      ).length

      const totalCounterGains = Object.values(path.mutations.increments).reduce(
        (a, b) => a + b,
        0
      )

      // 2. Evaluate Best General (Most non-romance flags)
      if (generalCount > maxGeneralBooleans) {
        maxGeneralBooleans = generalCount
        results.bestGeneral = [path]
      } else if (generalCount === maxGeneralBooleans && generalCount > 0) {
        results.bestGeneral.push(path)
      }

      // 3. Evaluate Best Counters
      if (totalCounterGains > maxCounterSum) {
        maxCounterSum = totalCounterGains
        results.bestCounterGains = [path]
      } else if (totalCounterGains === maxCounterSum && totalCounterGains > 0) {
        results.bestCounterGains.push(path)
      }

      // 4. Evaluate Romance Paths
      if (posRomanceCount > maxPosRomance) {
        maxPosRomance = posRomanceCount
        results.bestPositiveRomance = [path]
      } else if (posRomanceCount === maxPosRomance && posRomanceCount > 0) {
        results.bestPositiveRomance.push(path)
      }

      if (negRomanceCount > maxNegRomance) {
        maxNegRomance = negRomanceCount
        results.bestNegativeRomance = [path]
      } else if (negRomanceCount === maxNegRomance && negRomanceCount > 0) {
        results.bestNegativeRomance.push(path)
      }
    }

    return results
  }
}
