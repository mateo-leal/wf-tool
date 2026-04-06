import { PathResult } from '../pathfinder-types'
import {
  summarizeResults,
  overallScore,
  buildPreferredPathOptions,
} from '../ranker'

describe('ranker', () => {
  const createPathResult = (
    overrides: Partial<PathResult> = {}
  ): PathResult => ({
    path: [],
    chemistry: 0,
    thermostat: 0,
    hasThermostatCounter: false,
    activatedBooleans: 0,
    avoidedBooleanActivations: 0,
    booleanMutations: {},
    textLines: [],
    ...overrides,
  })

  describe('summarizeResults', () => {
    it('should find path with highest chemistry', () => {
      const results = [
        createPathResult({ chemistry: 5 }),
        createPathResult({ chemistry: 10 }),
        createPathResult({ chemistry: 3 }),
      ]
      const summary = summarizeResults(results)
      expect(summary.byChemistry.chemistry).toBe(10)
    })

    it('should find path with highest thermostat when enabled', () => {
      const results = [
        createPathResult({ thermostat: 5, hasThermostatCounter: true }),
        createPathResult({ thermostat: 15, hasThermostatCounter: true }),
        createPathResult({ thermostat: 3, hasThermostatCounter: false }),
      ]
      const summary = summarizeResults(results)
      expect(summary.thermostatEnabled).toBe(true)
      expect(summary.byThermostat?.thermostat).toBe(15)
    })

    it('should not set byThermostat when no thermostat counters', () => {
      const results = [
        createPathResult({ thermostat: 5, hasThermostatCounter: false }),
        createPathResult({ thermostat: 10, hasThermostatCounter: false }),
      ]
      const summary = summarizeResults(results)
      expect(summary.thermostatEnabled).toBe(false)
      expect(summary.byThermostat).toBeUndefined()
    })

    it('should find path with most boolean activations', () => {
      const results = [
        createPathResult({ activatedBooleans: 3 }),
        createPathResult({ activatedBooleans: 8 }),
        createPathResult({ activatedBooleans: 2 }),
      ]
      const summary = summarizeResults(results)
      expect(summary.byBooleans.activatedBooleans).toBe(8)
    })

    it('should include all paths tied for most boolean activations', () => {
      const results = [
        createPathResult({ path: [1, 2], activatedBooleans: 8 }),
        createPathResult({ path: [1, 3], activatedBooleans: 8 }),
        createPathResult({ path: [1, 4], activatedBooleans: 5 }),
      ]

      const summary = summarizeResults(results)

      expect(summary.byBooleans.activatedBooleans).toBe(8)
      expect(summary.byBooleansTies).toHaveLength(2)
      expect(
        summary.byBooleansTies.map((item) => item.path.join('->'))
      ).toEqual(expect.arrayContaining(['1->2', '1->3']))
    })

    it('should calculate overall best path', () => {
      const results = [
        createPathResult({
          chemistry: 5,
          thermostat: 0,
          activatedBooleans: 2,
          path: [1, 2],
        }),
        createPathResult({
          chemistry: 8,
          thermostat: 0,
          activatedBooleans: 3,
          path: [1, 2, 3],
        }),
        createPathResult({
          chemistry: 3,
          thermostat: 0,
          activatedBooleans: 5,
          path: [1],
        }),
      ]
      const summary = summarizeResults(results)
      // Most complex highest chemistry should win
      expect(summary.byOverall.chemistry).toBe(8)
    })

    it('should prioritize shorter paths when scores are equal', () => {
      const results = [
        createPathResult({
          chemistry: 10,
          thermostat: 0,
          activatedBooleans: 5,
          path: [1, 2, 3, 4],
        }),
        createPathResult({
          chemistry: 10,
          thermostat: 0,
          activatedBooleans: 5,
          path: [1, 2],
        }),
      ]
      const summary = summarizeResults(results)
      expect(summary.byOverall.path).toHaveLength(2)
    })

    it('should prefer paths with fewer avoided boolean activations on ties', () => {
      const results = [
        createPathResult({
          chemistry: 10,
          activatedBooleans: 2,
          avoidedBooleanActivations: 1,
          path: [1, 2, 3],
        }),
        createPathResult({
          chemistry: 10,
          activatedBooleans: 2,
          avoidedBooleanActivations: 0,
          path: [1, 2, 3, 4],
        }),
      ]

      const summary = summarizeResults(results)
      expect(summary.byOverall.avoidedBooleanActivations).toBe(0)
      expect(summary.byChemistry.avoidedBooleanActivations).toBe(0)
      expect(summary.byBooleans.avoidedBooleanActivations).toBe(0)
    })
  })

  describe('overallScore', () => {
    it('should weight chemistry at 3x', () => {
      const result = createPathResult({ chemistry: 10 })
      const scoreWithThermo = overallScore(result, true)
      expect(scoreWithThermo).toBeGreaterThanOrEqual(30) // 10 * 3
    })

    it('should weight thermostat at 2x when enabled', () => {
      const result = createPathResult({
        chemistry: 0,
        thermostat: 5,
        hasThermostatCounter: true,
      })
      const score = overallScore(result, true)
      expect(score).toBe(10) // 5 * 2
    })

    it('should ignore thermostat when not enabled', () => {
      const result = createPathResult({
        chemistry: 0,
        thermostat: 100,
        hasThermostatCounter: false,
      })
      const score = overallScore(result, false)
      expect(score).toBe(0) // Thermostat ignored
    })

    it('should count boolean activations 1:1', () => {
      const result = createPathResult({
        chemistry: 0,
        thermostat: 0,
        activatedBooleans: 7,
      })
      const score = overallScore(result, false)
      expect(score).toBe(7)
    })

    it('should combine all scores', () => {
      const result = createPathResult({
        chemistry: 10,
        thermostat: 5,
        activatedBooleans: 3,
        hasThermostatCounter: true,
      })
      const score = overallScore(result, true)
      expect(score).toBe(10 * 3 + 5 * 2 + 3) // 43
    })

    it('should penalize avoided boolean activations', () => {
      const result = createPathResult({
        chemistry: 10,
        thermostat: 5,
        activatedBooleans: 3,
        avoidedBooleanActivations: 1,
        hasThermostatCounter: true,
      })
      const score = overallScore(result, true)
      expect(score).toBe(41)
    })
  })

  describe('buildPreferredPathOptions', () => {
    it('should merge options with identical outcomes', () => {
      const options = [
        {
          label: 'Path 1',
          result: createPathResult({
            path: [1, 2],
            chemistry: 10,
          }),
        },
        {
          label: 'Path 2',
          result: createPathResult({
            path: [1, 2],
            chemistry: 10,
          }),
        },
      ]
      const result = buildPreferredPathOptions(options)
      expect(result).toHaveLength(1)
      expect(result[0].label).toContain('Path 1')
      expect(result[0].label).toContain('Path 2')
    })

    it('should merge distinct paths when outcomes are equivalent', () => {
      const options = [
        {
          label: 'Path 1',
          result: createPathResult({
            path: [1, 2],
            chemistry: 10,
          }),
        },
        {
          label: 'Path 2',
          result: createPathResult({
            path: [1, 3, 4],
            chemistry: 10,
          }),
        },
      ]
      const result = buildPreferredPathOptions(options)
      expect(result).toHaveLength(1)
      expect(result[0].label).toContain('Path 1')
      expect(result[0].label).toContain('Path 2')
    })

    it('should keep paths separate when boolean outcomes differ', () => {
      const options = [
        {
          label: 'With confession',
          result: createPathResult({
            path: [1, 2, 3],
            chemistry: 20,
            activatedBooleans: 1,
            booleanMutations: { ArthurConfessedFeels: true },
          }),
        },
        {
          label: 'Without confession',
          result: createPathResult({
            path: [1, 4, 5],
            chemistry: 20,
            activatedBooleans: 1,
            booleanMutations: {},
          }),
        },
      ]

      const result = buildPreferredPathOptions(options)
      expect(result).toHaveLength(2)
    })

    it('should return merged label when single path but multiple outcomes', () => {
      const options = [
        {
          label: 'Premium',
          result: createPathResult({
            path: [1, 2, 3],
            chemistry: 15,
          }),
        },
      ]
      const result = buildPreferredPathOptions(options)
      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('Premium')
    })

    it('should handle empty options', () => {
      expect(buildPreferredPathOptions([])).toEqual([])
    })

    it('should distinguish paths by chemistry', () => {
      const options = [
        {
          label: 'High',
          result: createPathResult({
            path: [1, 2, 3],
            chemistry: 20,
            activatedBooleans: 1,
          }),
        },
        {
          label: 'Low',
          result: createPathResult({
            path: [5, 6, 7],
            chemistry: 5,
            activatedBooleans: 3,
          }),
        },
      ]
      const merged = buildPreferredPathOptions(options)
      // Different paths should remain distinct
      expect(merged).toHaveLength(2)
    })

    it('should distinguish paths by thermostat', () => {
      const options = [
        {
          label: 'Hot',
          result: createPathResult({
            path: [1, 2, 3],
            thermostat: 100,
            hasThermostatCounter: true,
          }),
        },
        {
          label: 'Cold',
          result: createPathResult({
            path: [4, 5, 6],
            thermostat: 0,
            hasThermostatCounter: false,
          }),
        },
      ]
      const merged = buildPreferredPathOptions(options)
      // Different paths should remain distinct
      expect(merged).toHaveLength(2)
    })

    it('should distinguish paths by flirting boolean signature', () => {
      const options = [
        {
          label: 'Flirt',
          result: createPathResult({
            path: [1, 2, 3],
            chemistry: 10,
            booleanMutations: { FlirtWithAlice: true },
          }),
        },
        {
          label: 'NoFlirt',
          result: createPathResult({
            path: [4, 5, 6],
            chemistry: 10,
            booleanMutations: {},
            skippedFlirtingNodeIds: new Set([123]),
          }),
        },
      ]
      const merged = buildPreferredPathOptions(options)
      // Different paths should remain distinct
      expect(merged).toHaveLength(2)
    })

    it('should simplify redundant merged labels when all three best categories match', () => {
      const options = [
        {
          label: 'Best chemistry path (with ArthurConfessedFeels)',
          result: createPathResult({
            path: [1, 2, 3],
            chemistry: 20,
            activatedBooleans: 2,
            booleanMutations: { ArthurConfessedFeels: true },
          }),
        },
        {
          label: 'Most boolean activations (with ArthurConfessedFeels)',
          result: createPathResult({
            path: [1, 4, 5],
            chemistry: 20,
            activatedBooleans: 2,
            booleanMutations: { ArthurConfessedFeels: true },
          }),
        },
        {
          label: 'Best overall path (with ArthurConfessedFeels)',
          result: createPathResult({
            path: [1, 6, 7],
            chemistry: 20,
            activatedBooleans: 2,
            booleanMutations: { ArthurConfessedFeels: true },
          }),
        },
      ]
      const merged = buildPreferredPathOptions(options)
      expect(merged).toHaveLength(1)
      // Should only include "Best overall path" when all three categories are equivalent
      expect(merged[0].label).toBe(
        'Best overall path (with ArthurConfessedFeels)'
      )
      expect(merged[0].label).not.toContain('Best chemistry path')
      expect(merged[0].label).not.toContain('Most boolean activations')
    })
  })
})
