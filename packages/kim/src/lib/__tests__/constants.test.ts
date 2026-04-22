import {
  CHATROOMS,
  AVOIDABLE_BOOLEAN_NAMES,
  ROMANCE_BOOLEAN_NAMES,
  NO_ROMANCE_BOOLEAN_NAMES,
  NodeType,
} from '../constants'

describe('Constants', () => {
  describe('CHATROOMS', () => {
    it('should define CHATROOMS array', () => {
      expect(Array.isArray(CHATROOMS)).toBe(true)
      expect(CHATROOMS.length).toBeGreaterThan(0)
    })

    it('should contain known chatroom names', () => {
      expect(CHATROOMS).toContain('hex')
      expect(CHATROOMS).toContain('arthur')
      expect(CHATROOMS).toContain('eleanor')
    })

    it('should be readonly at compile time', () => {
      // TypeScript ensures this with 'as const'
      // Runtime check: array exists and is not empty
      expect(Array.isArray(CHATROOMS)).toBe(true)
      expect(CHATROOMS.length).toBeGreaterThan(0)
    })
  })

  describe('AVOIDABLE_BOOLEAN_NAMES', () => {
    it('should define AVOIDABLE_BOOLEAN_NAMES array', () => {
      expect(Array.isArray(AVOIDABLE_BOOLEAN_NAMES)).toBe(true)
    })

    it('should contain known avoidable booleans', () => {
      expect(AVOIDABLE_BOOLEAN_NAMES).toContain('LyonSuspicious')
      expect(AVOIDABLE_BOOLEAN_NAMES).toContain('DrifterLiar')
      expect(AVOIDABLE_BOOLEAN_NAMES).toContain('RoatheInsulted')
    })

    it('should not be empty', () => {
      expect(AVOIDABLE_BOOLEAN_NAMES.length).toBeGreaterThan(0)
    })
  })

  describe('ROMANCE_BOOLEAN_NAMES', () => {
    it('should define ROMANCE_BOOLEAN_NAMES array', () => {
      expect(Array.isArray(ROMANCE_BOOLEAN_NAMES)).toBe(true)
    })

    it('should contain known romance booleans', () => {
      expect(ROMANCE_BOOLEAN_NAMES).toContain('IsDating')
      expect(ROMANCE_BOOLEAN_NAMES).toContain('AmirDating')
      expect(ROMANCE_BOOLEAN_NAMES).toContain('ArthurDating')
      expect(ROMANCE_BOOLEAN_NAMES).toContain('EleanorDating')
    })

    it('should contain multiple romance options', () => {
      expect(ROMANCE_BOOLEAN_NAMES.length).toBeGreaterThan(20)
    })

    it('should be properly formatted', () => {
      ROMANCE_BOOLEAN_NAMES.forEach((name) => {
        expect(typeof name).toBe('string')
        expect(name.length).toBeGreaterThan(0)
      })
    })

    it('should not contain duplicates', () => {
      const unique = new Set(ROMANCE_BOOLEAN_NAMES)
      expect(unique.size).toBe(ROMANCE_BOOLEAN_NAMES.length)
    })
  })

  describe('NO_ROMANCE_BOOLEAN_NAMES', () => {
    it('should define NO_ROMANCE_BOOLEAN_NAMES array', () => {
      expect(Array.isArray(NO_ROMANCE_BOOLEAN_NAMES)).toBe(true)
    })

    it('should contain romance rejection booleans', () => {
      expect(NO_ROMANCE_BOOLEAN_NAMES.length).toBeGreaterThan(0)
    })

    it('should not duplicate ROMANCE_BOOLEAN_NAMES', () => {
      const romanceSet = new Set(ROMANCE_BOOLEAN_NAMES)
      NO_ROMANCE_BOOLEAN_NAMES.forEach((name) => {
        expect(romanceSet.has(name)).toBe(false)
      })
    })
  })

  describe('NodeType', () => {
    it('should define NodeType enum', () => {
      expect(NodeType).toBeDefined()
    })

    it('should define Start node type', () => {
      expect(NodeType.Start).toBeDefined()
      expect(typeof NodeType.Start).toBe('string')
    })

    it('should define Dialogue node type', () => {
      expect(NodeType.Dialogue).toBeDefined()
      expect(typeof NodeType.Dialogue).toBe('string')
    })

    it('should define PlayerChoice node type', () => {
      expect(NodeType.PlayerChoice).toBeDefined()
      expect(typeof NodeType.PlayerChoice).toBe('string')
    })

    it('should define End node type', () => {
      expect(NodeType.End).toBeDefined()
    })

    it('should define SetBoolean node type', () => {
      expect(NodeType.SetBoolean).toBeDefined()
    })

    it('should define CheckBoolean node type', () => {
      expect(NodeType.CheckBoolean).toBeDefined()
    })

    it('should define IncCounter node type', () => {
      expect(NodeType.IncCounter).toBeDefined()
    })

    it('should define CheckCounter node type', () => {
      expect(NodeType.CheckCounter).toBeDefined()
    })

    it('should define Chemistry node type', () => {
      expect(NodeType.Chemistry).toBeDefined()
    })

    it('should have unique values', () => {
      const values = Object.values(NodeType).filter(
        (v) => typeof v === 'string'
      )
      const unique = new Set(values)
      expect(unique.size).toBe(values.length)
    })

    it('should have correct number of node types', () => {
      // Count string enum values
      const stringValues = Object.values(NodeType).filter(
        (v) => typeof v === 'string'
      )
      expect(stringValues.length).toBeGreaterThan(5)
    })
  })

  describe('constant consistency', () => {
    it('should not have overlapping boolean names', () => {
      const romance = new Set(ROMANCE_BOOLEAN_NAMES)
      const noRomance = new Set(NO_ROMANCE_BOOLEAN_NAMES)
      const avoidable = new Set(AVOIDABLE_BOOLEAN_NAMES)

      // No overlap between romance and no-romance
      romance.forEach((name) => {
        expect(noRomance.has(name)).toBe(false)
      })

      // No overlap between romance and avoidable
      romance.forEach((name) => {
        expect(avoidable.has(name)).toBe(false)
      })

      // No overlap between no-romance and avoidable
      noRomance.forEach((name) => {
        expect(avoidable.has(name)).toBe(false)
      })
    })

    it('should have valid chatroom names', () => {
      CHATROOMS.forEach((room) => {
        expect(typeof room).toBe('string')
        expect(room.length).toBeGreaterThan(0)
        expect(/^[a-z-]+$/.test(room)).toBe(true) // Should be lowercase with hyphens
      })
    })
  })
})
