import { Type, DialogueNode } from '../../types'
import {
  resolveStartNodes,
  resolveContent,
  getConversationName,
  sourceLabel,
  getCounterName,
  getBooleanName,
  getMultiBooleanNames,
} from '../node-utils'

describe('node-utils', () => {
  describe('resolveStartNodes', () => {
    it('should return start nodes when they exist', () => {
      const nodes: DialogueNode[] = [
        { type: Type.StartDialogueNode, Id: 1, Content: 'Start 1' },
        { type: Type.StartDialogueNode, Id: 2, Content: 'Start 2' },
        { type: Type.DialogueNode, Id: 3, Content: 'Regular' },
      ]
      const result = resolveStartNodes(nodes)
      expect(result).toHaveLength(2)
      expect(result.every((n) => n.type === Type.StartDialogueNode)).toBe(true)
    })

    it('should return first node when no start nodes exist', () => {
      const nodes: DialogueNode[] = [
        { type: Type.DialogueNode, Id: 1, Content: 'First' },
        { type: Type.DialogueNode, Id: 2, Content: 'Second' },
      ]
      const result = resolveStartNodes(nodes)
      expect(result).toHaveLength(1)
      expect(result[0].Id).toBe(1)
    })

    it('should handle empty array', () => {
      const result = resolveStartNodes([])
      // Empty array returns array with one undefined element
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('resolveContent', () => {
    it('should return dictionary value when key exists', () => {
      const dict = new Map([
        ['KEY1', 'Hello World'],
        ['KEY2', 'Goodbye'],
      ])
      expect(resolveContent('KEY1', dict)).toBe('Hello World')
      expect(resolveContent('KEY2', dict)).toBe('Goodbye')
    })

    it('should return content as-is when not in dictionary', () => {
      const dict = new Map([['KEY1', 'Hello']])
      expect(resolveContent('ThisIsNotAKey', dict)).toBe('ThisIsNotAKey')
    })

    it('should handle empty dictionary', () => {
      const dict = new Map()
      expect(resolveContent('SomeContent', dict)).toBe('SomeContent')
    })
  })

  describe('getConversationName', () => {
    it('should prefer node content', () => {
      const source = '/path/to/Dialogue_rom.dialogue.json'
      const node: DialogueNode = {
        type: Type.StartDialogueNode,
        Id: 1,
        Content: 'My Conversation',
      }
      expect(getConversationName(source, node)).toBe('My Conversation')
    })

    it('should use source name when content is missing', () => {
      const source = '/path/to/AliceDialogue_rom.dialogue.json'
      const node: DialogueNode = {
        type: Type.StartDialogueNode,
        Id: 1,
      }
      expect(getConversationName(source, node)).toContain('AliceDialogue_rom')
    })

    it('should generate fallback with node ID', () => {
      const source = 'Dialogue.json'
      const node: DialogueNode = {
        type: Type.StartDialogueNode,
        Id: 123,
      }
      expect(getConversationName(source, node)).toMatch(/Dialogue.json#123/)
    })
  })

  describe('sourceLabel', () => {
    it('should extract filename from path', () => {
      expect(sourceLabel('/path/to/AliceDialogue_rom.dialogue.json')).toBe(
        'Alice'
      )
    })

    it('should remove full suffix', () => {
      const label = sourceLabel('/some/path/BobDialogue_rom.dialogue.json')
      expect(label).toBe('Bob')
    })

    it('should handle bare filename', () => {
      expect(sourceLabel('QuincyDialogue_rom.dialogue.json')).toBe('Quincy')
    })

    it('should return source as-is if no file pattern match', () => {
      const source = '/path/to/unknownfile.txt'
      const label = sourceLabel(source)
      expect(label).toBe('unknownfile.txt')
    })
  })

  describe('getCounterName', () => {
    it('should use CounterName when available', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        CounterName: 'MyCounter',
        Content: 'Other Content',
      }
      expect(getCounterName(node)).toBe('MyCounter')
    })

    it('should use first part of Content as fallback', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'Thermostat 5, extra data',
      }
      expect(getCounterName(node)).toBe('Thermostat 5')
    })

    it('should use whole Content if no comma', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        Content: 'SimpleCounter',
      }
      expect(getCounterName(node)).toBe('SimpleCounter')
    })

    it('should generate ID-based fallback', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 456,
      }
      expect(getCounterName(node)).toBe('counter-node-456')
    })

    it('should trim whitespace', () => {
      const node: DialogueNode = {
        type: Type.IncCounterDialogueNode,
        Id: 1,
        CounterName: '  SpacedCounter  ',
      }
      expect(getCounterName(node)).toBe('SpacedCounter')
    })
  })

  describe('getBooleanName', () => {
    it('should extract name from Content', () => {
      const node: DialogueNode = {
        type: Type.SetBooleanDialogueNode,
        Id: 1,
        Content: 'BooleanName',
      }
      expect(getBooleanName(node)).toBe('BooleanName')
    })

    it('should use first part if comma-separated', () => {
      const node: DialogueNode = {
        type: Type.CheckBooleanDialogueNode,
        Id: 1,
        Content: 'IsFlirting, extra info',
      }
      expect(getBooleanName(node)).toBe('IsFlirting')
    })

    it('should generate ID-based fallback', () => {
      const node: DialogueNode = {
        type: Type.SetBooleanDialogueNode,
        Id: 789,
      }
      expect(getBooleanName(node)).toBe('boolean-node-789')
    })

    it('should use whole Content when no comma', () => {
      const node: DialogueNode = {
        type: Type.CheckBooleanDialogueNode,
        Id: 1,
        Content: 'HasMetCharacter',
      }
      expect(getBooleanName(node)).toBe('HasMetCharacter')
    })

    it('should trim whitespace', () => {
      const node: DialogueNode = {
        type: Type.SetBooleanDialogueNode,
        Id: 1,
        Content: '  TrimmedBoolean,extra',
      }
      expect(getBooleanName(node)).toBe('TrimmedBoolean')
    })
  })

  describe('getMultiBooleanNames', () => {
    it('should extract expressions from multi-boolean outputs', () => {
      const node: DialogueNode = {
        type: Type.CheckMultiBooleanDialogueNode,
        Id: 1,
        Outputs: [
          {
            Expression: 'IsHappy',
            Outgoing: [1],
            Values: [],
            CompareOperators: [],
            LogicalOperators: [],
          },
          {
            Expression: 'IsAngry',
            Outgoing: [2],
            Values: [],
            CompareOperators: [],
            LogicalOperators: [],
          },
          {
            Expression: 'false',
            Outgoing: [3],
            Values: [],
            CompareOperators: [],
            LogicalOperators: [],
          },
        ],
      }
      const names = getMultiBooleanNames(node)
      expect(names).toContain('IsHappy')
      expect(names).toContain('IsAngry')
      expect(names).not.toContain('false')
    })

    it('should return empty array for non-multi-boolean nodes', () => {
      const node: DialogueNode = {
        type: Type.CheckBooleanDialogueNode,
        Id: 1,
        Content: 'SomeBool',
      }
      expect(getMultiBooleanNames(node)).toEqual([])
    })

    it('should handle missing outputs', () => {
      const node: DialogueNode = {
        type: Type.CheckMultiBooleanDialogueNode,
        Id: 1,
      }
      expect(getMultiBooleanNames(node)).toEqual([])
    })

    it('should ignore empty/whitespace expressions', () => {
      const node: DialogueNode = {
        type: Type.CheckMultiBooleanDialogueNode,
        Id: 1,
        Outputs: [
          {
            Expression: 'ValidBool',
            Outgoing: [1],
            Values: [],
            CompareOperators: [],
            LogicalOperators: [],
          },
          {
            Expression: '',
            Outgoing: [2],
            Values: [],
            CompareOperators: [],
            LogicalOperators: [],
          },
          {
            Expression: '   ',
            Outgoing: [3],
            Values: [],
            CompareOperators: [],
            LogicalOperators: [],
          },
        ],
      }
      const names = getMultiBooleanNames(node)
      expect(names).toEqual(['ValidBool'])
    })

    it('should remove duplicates', () => {
      const node: DialogueNode = {
        type: Type.CheckMultiBooleanDialogueNode,
        Id: 1,
        Outputs: [
          {
            Expression: 'SameBool',
            Outgoing: [1],
            Values: [],
            CompareOperators: [],
            LogicalOperators: [],
          },
          {
            Expression: 'SameBool',
            Outgoing: [2],
            Values: [],
            CompareOperators: [],
            LogicalOperators: [],
          },
        ],
      }
      const names = getMultiBooleanNames(node)
      expect(names).toEqual(['SameBool'])
    })
  })
})
