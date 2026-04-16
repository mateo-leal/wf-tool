import { Type, DialogueNode } from '../../types'
import {
  isThermostatCounterNode,
  extractThermostatDelta,
  evaluateCounterOutput,
  countBooleanActivations,
} from '../counter-utils'

describe('counter-utils', () => {
  describe('isThermostatCounterNode', () => {
    it('should detect thermostat counter nodes', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'Thermostat 5',
      }
      expect(isThermostatCounterNode(node)).toBe(true)
    })

    it('should handle negative values', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'Thermostat -3',
      }
      expect(isThermostatCounterNode(node)).toBe(true)
    })

    it('should be case-insensitive', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'THERMOSTAT 10',
      }
      expect(isThermostatCounterNode(node)).toBe(true)
    })

    it('should reject non-counter nodes', () => {
      const node: DialogueNode = {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'Not a counter',
      }
      expect(isThermostatCounterNode(node)).toBe(false)
    })

    it('should reject non-thermostat counters', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'SomeCounter 10',
      }
      expect(isThermostatCounterNode(node)).toBe(false)
    })

    it('should reject nodes without content', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
      }
      expect(isThermostatCounterNode(node)).toBe(false)
    })
  })

  describe('extractThermostatDelta', () => {
    it('should extract positive delta', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'Thermostat 5',
      }
      expect(extractThermostatDelta(node)).toBe(5)
    })

    it('should extract negative delta', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'Thermostat -3',
      }
      expect(extractThermostatDelta(node)).toBe(-3)
    })

    it('should return 0 for non-thermostat nodes', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'SomeCounter 10',
      }
      expect(extractThermostatDelta(node)).toBe(0)
    })

    it('should return 0 for nodes without content', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
      }
      expect(extractThermostatDelta(node)).toBe(0)
    })

    it('should handle extra spaces', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: '  Thermostat   8  ',
      }
      expect(extractThermostatDelta(node)).toBe(8)
    })
  })

  describe('evaluateCounterOutput', () => {
    it('should return true when no operators provided and expression is not "false"', () => {
      const output = {
        Expression: 'true',
        Outgoing: [1, 2],
        Values: [],
        CompareOperators: [],
        LogicalOperators: [],
      }
      expect(evaluateCounterOutput(output, 5)).toBe(true)
    })

    it('should return false when expression is "false"', () => {
      const output = {
        Expression: 'false',
        Outgoing: [],
        Values: [],
        CompareOperators: [],
        LogicalOperators: [],
      }
      expect(evaluateCounterOutput(output, 5)).toBe(false)
    })

    it('should evaluate >= comparison (op 4)', () => {
      const output = {
        Expression: 'count >= 5',
        Outgoing: [1],
        Values: [5],
        CompareOperators: [4],
        LogicalOperators: [],
      }
      expect(evaluateCounterOutput(output, 5)).toBe(true)
      expect(evaluateCounterOutput(output, 6)).toBe(true)
      expect(evaluateCounterOutput(output, 4)).toBe(false)
    })

    it('should evaluate > comparison (op 3)', () => {
      const output = {
        Expression: 'count > 5',
        Outgoing: [1],
        Values: [5],
        CompareOperators: [3],
        LogicalOperators: [],
      }
      expect(evaluateCounterOutput(output, 6)).toBe(true)
      expect(evaluateCounterOutput(output, 5)).toBe(false)
    })

    it('should evaluate < comparison (op 2)', () => {
      const output = {
        Expression: 'count < 5',
        Outgoing: [1],
        Values: [5],
        CompareOperators: [2],
        LogicalOperators: [],
      }
      expect(evaluateCounterOutput(output, 4)).toBe(true)
      expect(evaluateCounterOutput(output, 5)).toBe(false)
    })

    it('should evaluate <= comparison (op 1)', () => {
      const output = {
        Expression: 'count <= 5',
        Outgoing: [1],
        Values: [5],
        CompareOperators: [1],
        LogicalOperators: [],
      }
      expect(evaluateCounterOutput(output, 5)).toBe(true)
      expect(evaluateCounterOutput(output, 4)).toBe(true)
      expect(evaluateCounterOutput(output, 6)).toBe(false)
    })

    it('should handle multiple comparisons with AND', () => {
      const output = {
        Expression: 'count >= 3 AND count <= 7',
        Outgoing: [1],
        Values: [3, 7],
        CompareOperators: [4, 1],
        LogicalOperators: [0], // 0 = AND
      }
      expect(evaluateCounterOutput(output, 5)).toBe(true)
      expect(evaluateCounterOutput(output, 3)).toBe(true)
      expect(evaluateCounterOutput(output, 7)).toBe(true)
      expect(evaluateCounterOutput(output, 2)).toBe(false)
      expect(evaluateCounterOutput(output, 8)).toBe(false)
    })

    it('should handle multiple comparisons with OR', () => {
      const output = {
        Expression: 'count < 3 OR count > 7',
        Outgoing: [1],
        Values: [3, 7],
        CompareOperators: [2, 3],
        LogicalOperators: [1], // 1 = OR
      }
      expect(evaluateCounterOutput(output, 2)).toBe(true)
      expect(evaluateCounterOutput(output, 8)).toBe(true)
      expect(evaluateCounterOutput(output, 5)).toBe(false)
    })

    it('should handle invalid values gracefully', () => {
      const output = {
        Expression: 'count > invalid',
        Outgoing: [1],
        Values: ['not a number'],
        CompareOperators: [3],
        LogicalOperators: [],
      }
      expect(evaluateCounterOutput(output, 5)).toBe(false)
    })
  })

  describe('countBooleanActivations', () => {
    it('should return 0 for non-boolean-set nodes', () => {
      const node: DialogueNode = {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'Some dialogue',
      }
      expect(countBooleanActivations(node)).toBe(0)
    })

    it('should count content as an activation', () => {
      const node: DialogueNode = {
        type: Type.SetBooleanDialogueNode,
        Id: 1,
        Content: 'BoolName',
      }
      expect(countBooleanActivations(node)).toBe(1)
    })

    it('should count unique true nodes', () => {
      const node: DialogueNode = {
        type: Type.SetBooleanDialogueNode,
        Id: 1,
        Content: 'BoolName',
        TrueNodes: [10, 11, 12],
      }
      expect(countBooleanActivations(node)).toBe(4) // content + 3 nodes
    })

    it('should count unique false nodes', () => {
      const node: DialogueNode = {
        type: Type.ResetBooleanDialogueNode,
        Id: 1,
        Content: 'BoolName',
        FalseNodes: [20, 21],
      }
      expect(countBooleanActivations(node)).toBe(3) // content + 2 nodes
    })

    it('should deduplicate activation counts', () => {
      const node: DialogueNode = {
        type: Type.SetBooleanDialogueNode,
        Id: 1,
        Content: 'BoolName',
        TrueNodes: [10, 10, 11],
        FalseNodes: [10, 12],
      }
      // Should count unique: BoolName, 10, 11, 12
      expect(countBooleanActivations(node)).toBe(4)
    })

    it('should count output values', () => {
      const node: DialogueNode = {
        type: Type.SetBooleanDialogueNode,
        Id: 1,
        Content: 'BoolName',
        Outputs: [
          {
            Expression: 'test',
            Outgoing: [],
            Values: [100, 101, 102],
            CompareOperators: [],
            LogicalOperators: [],
          },
        ],
      }
      expect(countBooleanActivations(node)).toBeGreaterThanOrEqual(4)
    })
  })
})
