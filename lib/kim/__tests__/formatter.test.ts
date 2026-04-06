import { Type, DialogueNode } from '../../types'
import { PathResult } from '../pathfinder-types'
import { formatPathMetrics, formatPathAsChat } from '../formatter'

describe('formatter', () => {
  const createPathResult = (
    overrides: Partial<PathResult> = {}
  ): PathResult => ({
    path: [],
    chemistry: 0,
    thermostat: 0,
    hasThermostatCounter: false,
    activatedBooleans: 0,
    booleanMutations: {},
    textLines: [],
    ...overrides,
  })

  describe('formatPathMetrics', () => {
    it('should show chemistry and booleans', () => {
      const result = createPathResult({
        chemistry: 10,
        activatedBooleans: 3,
      })
      const formatted = formatPathMetrics(result)
      expect(formatted).toContain('chemistry=10')
      expect(formatted).toContain('booleans=3')
    })

    it('should include thermostat when counter present', () => {
      const result = createPathResult({
        chemistry: 5,
        activatedBooleans: 2,
        thermostat: 15,
        hasThermostatCounter: true,
      })
      const formatted = formatPathMetrics(result)
      expect(formatted).toContain('thermostat=15')
    })

    it('should omit thermostat when counter absent', () => {
      const result = createPathResult({
        chemistry: 5,
        activatedBooleans: 2,
        thermostat: 15,
        hasThermostatCounter: false,
      })
      const formatted = formatPathMetrics(result)
      expect(formatted).not.toContain('thermostat')
    })

    it('should format with brackets', () => {
      const result = createPathResult({
        chemistry: 5,
        activatedBooleans: 1,
      })
      const formatted = formatPathMetrics(result)
      expect(formatted).toMatch(/\[.*\]/)
    })
  })

  describe('formatPathAsChat', () => {
    const byId = new Map<number, DialogueNode>()
    const resolveText = (text: string) => text

    beforeEach(() => {
      byId.clear()
    })

    it('should skip chemistry nodes and include delta', () => {
      byId.set(1, {
        type: Type.ChemistryDialogueNode,
        Id: 1,
        ChemistryDelta: 5,
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines).toContainEqual(
        expect.objectContaining({ user: 'system', content: '5' })
      )
    })

    it('should include character dialogue', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'Hello!',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines).toHaveLength(1)
      expect(lines[0]).toMatchObject({
        user: 'Alice',
        content: 'Hello!',
      })
    })

    it('should use Speaker field when available', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'I am speaking',
        Speaker: 'SpecialCharacter',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(
        result,
        byId,
        'DefaultSpeaker',
        resolveText
      )
      expect(lines[0].user).toBe('SpecialCharacter')
    })

    it('should identify player choices', () => {
      byId.set(1, {
        type: Type.PlayerChoiceDialogueNode,
        Id: 1,
        Content: 'I choose this path',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines[0].user).toBe('player')
      expect(lines[0].content).toBe('I choose this path')
    })

    it('should skip nodes with missing content', () => {
      byId.set(1, { type: Type.DialogueNode, Id: 1 })
      byId.set(2, { type: Type.DialogueNode, Id: 2, Content: 'Present' })
      const result = createPathResult({ path: [1, 2] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines).toHaveLength(1)
      expect(lines[0].content).toBe('Present')
    })

    it('should skip nodes with empty content', () => {
      byId.set(1, { type: Type.DialogueNode, Id: 1, Content: '' })
      byId.set(2, { type: Type.DialogueNode, Id: 2, Content: '  ' })
      byId.set(3, { type: Type.DialogueNode, Id: 3, Content: 'Real' })
      const result = createPathResult({ path: [1, 2, 3] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines).toHaveLength(1)
      expect(lines[0].content).toBe('Real')
    })

    it('should normalize whitespace in content', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: '  Multi   spaced    text  ',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines[0].content).toBe('Multi spaced text')
    })

    it('should resolve text through dictionary', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'KEY_DIALOGUE',
        Speaker: 'KEY_SPEAKER',
      })
      const customResolve = (text: string) => {
        if (text === 'KEY_DIALOGUE') return 'Resolved dialogue'
        if (text === 'KEY_SPEAKER') return 'ResolvedSpeaker'
        return text
      }
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Default', customResolve)
      expect(lines[0].content).toBe('Resolved dialogue')
      expect(lines[0].user).toBe('ResolvedSpeaker')
    })

    it('should interpret literal \\r\\n escape sequences as newlines', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'First line\\r\\nSecond line',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines[0].content).toBe('First line\nSecond line')
    })

    it('should interpret literal \\n escape sequences as newlines', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'Line one\\nLine two\\nLine three',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines[0].content).toBe('Line one\nLine two\nLine three')
    })

    it('should normalize whitespace within each line independently', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: '  Multi   spaced  \\r\\n  second  line  ',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines[0].content).toBe('Multi spaced\nsecond line')
    })

    it('should preserve emoji tokens for renderer-level replacement', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'I love you <RETRO_EMOJI_HEART>',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines[0].content).toBe('I love you <RETRO_EMOJI_HEART>')
    })

    it('should skip nodes not in byId map', () => {
      byId.set(1, { type: Type.DialogueNode, Id: 1, Content: 'Present' })
      const result = createPathResult({ path: [1, 999] }) // 999 doesn't exist
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines).toHaveLength(1)
      expect(lines[0].content).toBe('Present')
    })

    it('should preserve node type in output', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'Test',
      })
      const result = createPathResult({ path: [1] })
      const lines = formatPathAsChat(result, byId, 'Alice', resolveText)
      expect(lines[0].type).toBe(Type.DialogueNode)
    })

    it('should handle complex path with multiple node types', () => {
      byId.set(1, {
        type: Type.DialogueNode,
        Id: 1,
        Content: 'First',
        Speaker: 'Alice',
      })
      byId.set(2, {
        type: Type.PlayerChoiceDialogueNode,
        Id: 2,
        Content: 'My choice',
      })
      byId.set(3, {
        type: Type.DialogueNode,
        Id: 3,
        Content: 'Response',
        Speaker: 'Bob',
      })
      const result = createPathResult({ path: [1, 2, 3] })
      const lines = formatPathAsChat(
        result,
        byId,
        'DefaultSpeaker',
        resolveText
      )
      expect(lines).toHaveLength(3)
      expect(lines[0].user).toBe('Alice')
      expect(lines[1].user).toBe('player')
      expect(lines[2].user).toBe('Bob')
    })
  })
})
