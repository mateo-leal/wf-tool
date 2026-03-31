import { explorePaths } from '../explorer'
import { DialogueNode, Type } from '../../types'

describe('explorer', () => {
  async function runExplore(nodes: DialogueNode[], startId: number) {
    const byId = new Map(nodes.map((node) => [node.Id, node]))
    const startNode = byId.get(startId)

    if (!startNode) {
      throw new Error(`Start node ${startId} not found`)
    }

    return explorePaths({
      byId,
      node: startNode,
      maxDepth: 20,
      maxPaths: 50,
      resolveText: (value) => value,
      askBooleanDecision: async () => false,
      askCounterBranch: async (node) => node.Outgoing ?? [],
    })
  }

  it('keeps terminal flirting set nodes in path for skipped branches', async () => {
    const nodes: DialogueNode[] = [
      {
        type: Type.StartDialogueNode,
        Id: 1,
        Content: 'Start',
        Outgoing: [2],
      },
      {
        type: Type.DialogueNode,
        Id: 2,
        Content: 'Before confession',
        Outgoing: [3],
      },
      {
        type: Type.SetBooleanDialogueNode,
        Id: 3,
        Content: 'ArthurConfessedFeels',
        Outgoing: [4],
      },
      {
        type: Type.EndDialogueNode,
        Id: 4,
        Content: 'ArthurConfession',
      },
    ]

    const results = await runExplore(nodes, 1)

    expect(results).toHaveLength(2)

    expect(results).toContainEqual(
      expect.objectContaining({
        path: [1, 2, 3, 4],
        activatedBooleans: 1,
        booleanMutations: { ArthurConfessedFeels: true },
      })
    )

    expect(results).toContainEqual(
      expect.objectContaining({
        path: [1, 2, 3, 4],
        activatedBooleans: 1,
        booleanMutations: {},
      })
    )
  })

  it('keeps non-terminal flirting set nodes in path for skipped branches', async () => {
    const nodes: DialogueNode[] = [
      {
        type: Type.StartDialogueNode,
        Id: 1,
        Content: 'Start',
        Outgoing: [2],
      },
      {
        type: Type.SetBooleanDialogueNode,
        Id: 2,
        Content: 'ArthurConfessedFeels',
        Outgoing: [3],
      },
      {
        type: Type.DialogueNode,
        Id: 3,
        Content: 'After skipped boolean',
        Outgoing: [4],
      },
      {
        type: Type.EndDialogueNode,
        Id: 4,
      },
    ]

    const results = await runExplore(nodes, 1)

    expect(results).toHaveLength(2)

    expect(results).toContainEqual(
      expect.objectContaining({
        path: [1, 2, 3, 4],
        activatedBooleans: 1,
        booleanMutations: { ArthurConfessedFeels: true },
      })
    )

    expect(results).toContainEqual(
      expect.objectContaining({
        path: [1, 2, 3, 4],
        activatedBooleans: 1,
        booleanMutations: {},
      })
    )
  })
})
