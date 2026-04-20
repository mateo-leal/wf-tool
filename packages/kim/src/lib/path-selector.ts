import { DialoguePath, OptimizedResults } from '../types'
import { PathOptimizationOptions } from '../types/internal'
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
        ...(options?.positiveRomanceBooleans ?? []),
        ...ROMANCE_BOOLEAN_NAMES,
      ],
      negativeRomanceBooleans: [
        ...(options?.negativeRomanceBooleans ?? []),
        ...NO_ROMANCE_BOOLEAN_NAMES,
      ],
    }

    const results: OptimizedResults = {
      bestGeneral: [],
      bestChemistry: [],
      bestCounterGains: [],
      bestPositiveRomance: [],
      bestNegativeRomance: [],
    }

    // Fallback Trackers
    let longestCleanPaths: DialoguePath[] = []
    let longestAnyPaths: DialoguePath[] = []

    for (const path of paths) {
      const hasAvoidable = path.mutations.set.some((b) =>
        finalOptions.avoidableBooleans.includes(b)
      )

      // Update Fallbacks (Longest Path)
      if (path.nodes.length >= (longestAnyPaths[0]?.nodes.length ?? 0)) {
        if (path.nodes.length > (longestAnyPaths[0]?.nodes.length ?? 0))
          longestAnyPaths = []
        if (!longestAnyPaths.some((u) => this.areMutationsEqual(u, path)))
          longestAnyPaths.push(path)
      }

      if (!hasAvoidable) {
        if (path.nodes.length >= (longestCleanPaths[0]?.nodes.length ?? 0)) {
          if (path.nodes.length > (longestCleanPaths[0]?.nodes.length ?? 0))
            longestCleanPaths = []
          if (!longestCleanPaths.some((u) => this.areMutationsEqual(u, path)))
            longestCleanPaths.push(path)
        }
      }

      if (hasAvoidable) continue

      // Score Calculation
      const posRomCount = path.mutations.set.filter((b) =>
        finalOptions.positiveRomanceBooleans.includes(b)
      ).length
      const negRomCount = path.mutations.set.filter((b) =>
        finalOptions.negativeRomanceBooleans.includes(b)
      ).length
      const counterSum = Object.values(path.mutations.increments).reduce(
        (a, b) => a + b,
        0
      )
      const chemistry = path.mutations.chemistry
      const generalSetCount = path.mutations.set.filter(
        (b) =>
          !finalOptions.positiveRomanceBooleans.includes(b) &&
          !finalOptions.negativeRomanceBooleans.includes(b)
      ).length
      const generalResetCount = path.mutations.reset.length

      // Logic for Romance / Counter / Chemistry buckets (Standard logic)
      const updateSimpleBucket = (
        score: number,
        key: keyof OptimizedResults
      ) => {
        if (score <= 0) return

        const current = results[key]

        // Tier 0: If bucket is empty, initialize it
        if (current.length === 0) {
          results[key] = [path]
          return
        }

        const winner = current[0]!
        const maxScore =
          key === 'bestChemistry'
            ? winner.mutations.chemistry
            : key === 'bestCounterGains'
              ? Object.values(winner.mutations.increments).reduce(
                  (a, b) => a + b,
                  0
                )
              : key === 'bestPositiveRomance'
                ? winner.mutations.set.filter((b) =>
                    finalOptions.positiveRomanceBooleans.includes(b)
                  ).length
                : winner.mutations.set.filter((b) =>
                    finalOptions.negativeRomanceBooleans.includes(b)
                  ).length

        if (score > maxScore) {
          results[key] = [path]
        } else if (score === maxScore) {
          if (path.nodes.length < winner.nodes.length) {
            results[key] = [path]
          } else if (
            path.nodes.length === winner.nodes.length &&
            !current.some((w) => this.areMutationsEqual(w, path))
          ) {
            current.push(path)
          }
        }
      }

      // Custom Logic for BEST GENERAL (Multi-Tier Priority)
      const updateBestGeneral = () => {
        if (generalSetCount <= 0) return
        if (results.bestGeneral.length === 0) {
          results.bestGeneral = [path]
          return
        }

        const winner = results.bestGeneral[0]!
        const winnerSet = winner.mutations.set.filter(
          (b) =>
            !finalOptions.positiveRomanceBooleans.includes(b) &&
            !finalOptions.negativeRomanceBooleans.includes(b)
        ).length
        const winnerChem = winner.mutations.chemistry
        const winnerCounter = Object.values(winner.mutations.increments).reduce(
          (a, b) => a + b,
          0
        )
        const winnerReset = winner.mutations.reset.length

        // Tiered Priority Check
        const isBetter =
          generalSetCount > winnerSet ||
          (generalSetCount === winnerSet && chemistry > winnerChem) ||
          (generalSetCount === winnerSet &&
            chemistry === winnerChem &&
            counterSum > winnerCounter) ||
          (generalSetCount === winnerSet &&
            chemistry === winnerChem &&
            counterSum === winnerCounter &&
            generalResetCount < winnerReset) ||
          (generalSetCount === winnerSet &&
            chemistry === winnerChem &&
            counterSum === winnerCounter &&
            generalResetCount === winnerReset &&
            path.nodes.length < winner.nodes.length)

        const isSame =
          generalSetCount === winnerSet &&
          chemistry === winnerChem &&
          counterSum === winnerCounter &&
          generalResetCount === winnerReset &&
          path.nodes.length === winner.nodes.length

        if (isBetter) {
          results.bestGeneral = [path]
        } else if (isSame) {
          if (
            !results.bestGeneral.some((w) => this.areMutationsEqual(w, path))
          ) {
            results.bestGeneral.push(path)
          }
        }
      }

      updateBestGeneral()
      updateSimpleBucket(counterSum, 'bestCounterGains')
      updateSimpleBucket(posRomCount, 'bestPositiveRomance')
      updateSimpleBucket(negRomCount, 'bestNegativeRomance')
      updateSimpleBucket(chemistry, 'bestChemistry')
    }

    // Final Fallback
    if (results.bestGeneral.length === 0 && paths.length > 0) {
      results.bestGeneral =
        longestCleanPaths.length > 0 ? longestCleanPaths : longestAnyPaths
    }

    return results
  }

  private static areMutationsEqual(
    p1: DialoguePath,
    p2: DialoguePath
  ): boolean {
    // Compare Booleans Set
    if (p1.mutations.set.length !== p2.mutations.set.length) return false
    const s1 = new Set(p1.mutations.set)
    if (!p2.mutations.set.every((b) => s1.has(b))) return false

    // Compare Booleans Reset
    if (p1.mutations.reset.length !== p2.mutations.reset.length) return false
    const r1 = new Set(p1.mutations.reset)
    if (!p2.mutations.reset.every((b) => r1.has(b))) return false

    // Compare Increments
    const keys1 = Object.keys(p1.mutations.increments)
    const keys2 = Object.keys(p2.mutations.increments)
    if (keys1.length !== keys2.length) return false
    return keys1.every(
      (k) => p1.mutations.increments[k] === p2.mutations.increments[k]
    )
  }
}
