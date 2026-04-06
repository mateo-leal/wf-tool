import { Type, type DialogueNode } from '../../../lib/types'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}))

jest.mock('@/lib/kim/loader', () => ({
  loadNodes: jest.fn(),
  loadDictionary: jest.fn(),
}))

import { loadDictionary, loadNodes } from '@/lib/kim/loader'

const mockedLoadNodes = jest.mocked(loadNodes)
const mockedLoadDictionary = jest.mocked(loadDictionary)

describe('GET /api/dialogues boolean-aware start labels', () => {
  let GET: (request: Request) => Promise<Response>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  beforeAll(async () => {
    ;({ GET } = await import('./route'))
  })

  function buildMarie1113Graph(): DialogueNode[] {
    return [
      {
        type: Type.StartDialogueNode,
        Id: 1113,
        Content: 'MarieRank3Convo3',
        Outgoing: [2000],
      },
      {
        type: Type.CheckBooleanDialogueNode,
        Id: 2000,
        Content: 'MarieGraveyard1',
        TrueNodes: [3001, 3002, 3003],
        FalseNodes: [3001, 3002, 3004],
      },
      {
        type: Type.DialogueNode,
        Id: 3001,
        Content: 'OPT_A',
      },
      {
        type: Type.DialogueNode,
        Id: 3002,
        Content: 'OPT_B',
      },
      {
        type: Type.DialogueNode,
        Id: 3003,
        Content: 'OPT_TRUE_ONLY',
      },
      {
        type: Type.DialogueNode,
        Id: 3004,
        Content: 'OPT_FALSE_ONLY',
      },
    ]
  }

  it('returns three previews with true-only branch when MarieGraveyard1=true', async () => {
    mockedLoadNodes.mockResolvedValue(buildMarie1113Graph())
    mockedLoadDictionary.mockResolvedValue(
      new Map([
        ['OPT_A', 'Option A'],
        ['OPT_B', 'Option B'],
        ['OPT_TRUE_ONLY', 'True branch option'],
        ['OPT_FALSE_ONLY', 'False branch option'],
      ])
    )

    const request = {
      url:
        'http://localhost:3000/api/dialogues?chatroom=marie&language=en&booleans=' +
        encodeURIComponent(JSON.stringify({ MarieGraveyard1: true })),
    } as Request

    const response = await GET(request)
    const body = (await response.json()) as {
      options: Array<{ id: number; label: string; codename: string }>
    }

    expect(response.status).toBe(200)
    expect(body.options).toHaveLength(1)
    expect(body.options[0].id).toBe(1113)
    expect(body.options[0].codename).toBe('MarieRank3Convo3')
    expect(body.options[0].label).toContain('Option A')
    expect(body.options[0].label).toContain('Option B')
    expect(body.options[0].label).toContain('True branch option')
    expect(body.options[0].label).not.toContain('False branch option')
  })

  it('returns three previews with false-only branch when MarieGraveyard1=false', async () => {
    mockedLoadNodes.mockResolvedValue(buildMarie1113Graph())
    mockedLoadDictionary.mockResolvedValue(
      new Map([
        ['OPT_A', 'Option A'],
        ['OPT_B', 'Option B'],
        ['OPT_TRUE_ONLY', 'True branch option'],
        ['OPT_FALSE_ONLY', 'False branch option'],
      ])
    )

    const request = {
      url:
        'http://localhost:3000/api/dialogues?chatroom=marie&language=en&booleans=' +
        encodeURIComponent(JSON.stringify({ MarieGraveyard1: false })),
    } as Request

    const response = await GET(request)
    const body = (await response.json()) as {
      options: Array<{ id: number; label: string; codename: string }>
    }

    expect(response.status).toBe(200)
    expect(body.options).toHaveLength(1)
    expect(body.options[0].id).toBe(1113)
    expect(body.options[0].codename).toBe('MarieRank3Convo3')
    expect(body.options[0].label).toContain('Option A')
    expect(body.options[0].label).toContain('Option B')
    expect(body.options[0].label).toContain('False branch option')
    expect(body.options[0].label).not.toContain('True branch option')
  })
})
