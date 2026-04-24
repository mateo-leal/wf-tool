import { Chat } from './chat'
import {
  DialogueContentNode,
  DialoguePath,
  FirstContentNode,
  IncCounterDialogueNode,
  Output,
  SimulationState,
  type Node,
  type StartDialogueNode,
} from '../types'
import { NodeType } from './constants'
import type { SimulationTracking, TraversalOptions } from '../types/internal'
import { NodeInvalidType, NodeNotFound, UnsupportedOperation } from './errors'

/**
 * Simulation class to traverse dialogue paths in a Chat instance,
 * tracking state changes and interactions.
 */
export class Simulation {
  /**
   * Create a new Simulation instance with the given Chat and options.
   * @param chat The Chat instance to simulate on
   * @param options
   */
  constructor(
    private readonly chat: Chat,
    private readonly options?: TraversalOptions
  ) {}

  /**
   * Get all possible paths through the dialogue graph starting from the given node,
   * along with their final states and tracking information.
   * @param startNode The starting node or its ID to begin the simulation from
   * @returns An array of DialoguePath objects representing all possible paths from the start node
   * @throws An error if the start node is not found or is not a StartDialogueNode
   */
  getPaths(
    startNode: StartDialogueNode | number,
    customState?: SimulationState
  ) {
    const node = this.getStartNodeOrThrow(startNode)
    const paths: DialoguePath[] = []
    const state: SimulationState = {
      booleans: {
        ...this.options?.initialState?.booleans,
        ...customState?.booleans,
      },
      counters: {
        ...this.options?.initialState?.counters,
        ...customState?.counters,
      },
    }
    this.traverse(node, state, [], paths, new Set())
    return paths
  }

  findAllFirstContentNodes() {
    return this.chat.startNodes.map(this.findFirstContentNodes.bind(this))
  }

  findFirstContentNodes(
    startNode: StartDialogueNode | number
  ): FirstContentNode {
    const node = this.getStartNodeOrThrow(startNode)

    const results: DialogueContentNode[] = []
    const visited = new Set<number>()
    const queue: number[] = [node.Id]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (visited.has(currentId)) continue
      visited.add(currentId)

      const currentNode = this.chat.getById(currentId)
      if (!currentNode) continue

      // Stop if we hit a content node
      if (
        currentNode.type === NodeType.Dialogue ||
        currentNode.type === NodeType.PlayerChoice
      ) {
        results.push(currentNode)
        continue
      }

      // Otherwise evaluate logic and keep searching
      const nextIds = this.getImmediateNextIds(currentNode)
      queue.push(...nextIds)
    }

    return { id: node.Id, convoName: node.Content, dialogueNodes: results }
  }

  /**
   * Recursive traversal function to explore all paths from the current node,
   * updating state and tracking information along the way.
   * @param node The current node being processed
   * @param currentState The current state of the simulation (booleans and counters)
   * @param currentPath The path of nodes taken to reach the current node
   * @param results The array to store completed paths once an end node or a visited node is reached
   * @param visited A set of node IDs that have been visited in the current path to detect cycles
   * @param isUncertain A flag indicating whether the current path is uncertain due to CheckBooleanScript nodes
   * @param tracking An object to track which checks and mutations have been encountered along the path
   * @returns void (results are stored in the `results` array parameter)
   */
  private traverse(
    node: Node,
    currentState: SimulationState,
    currentPath: Node[],
    results: DialoguePath[],
    visited: Set<number>,
    isUncertain = false,
    tracking: SimulationTracking = {
      checks: { booleans: new Set<string>(), counters: new Set<string>() },
      mutations: {
        chemistry: 0,
        set: new Set<string>(),
        reset: new Set<string>(),
        increments: {} as Record<string, number>,
      },
    }
  ) {
    const initialState = this.options?.initialState ?? {
      booleans: {},
      counters: {},
    }
    const newPath = [...currentPath, node]
    let pathUncertain = isUncertain || node.type === NodeType.CheckBooleanScript

    if (visited.has(node.Id)) {
      results.push(
        this.finalizePath(newPath, currentState, pathUncertain, tracking)
      )
      return
    }

    const newVisited = new Set(visited).add(node.Id)

    let nextState = {
      booleans: { ...currentState.booleans },
      counters: { ...currentState.counters },
    }
    let nextTracking: SimulationTracking = {
      checks: {
        booleans: new Set(tracking.checks.booleans),
        counters: new Set(tracking.checks.counters),
      },
      mutations: {
        chemistry: tracking.mutations.chemistry,
        set: new Set(tracking.mutations.set),
        reset: new Set(tracking.mutations.reset),
        increments: { ...tracking.mutations.increments },
      },
    }

    switch (node.type) {
      case NodeType.Chemistry:
        nextTracking.mutations.chemistry =
          (nextTracking.mutations.chemistry ?? 0) + (node.ChemistryDelta ?? 0)
        break
      case NodeType.SetBoolean:
        if (!initialState.booleans[node.Content]) {
          nextState.booleans[node.Content] = true
          nextTracking.mutations.set.add(node.Content)
        }
        nextTracking.mutations.reset.delete(node.Content)
        break
      case NodeType.ResetBoolean:
        if (initialState.booleans[node.Content] !== false) {
          nextState.booleans[node.Content] = false
          nextTracking.mutations.reset.add(node.Content)
        }
        nextTracking.mutations.set.delete(node.Content)
        break
      case NodeType.IncCounter: {
        const { counterName, value } = this.getCounter(node)
        nextState.counters[counterName] =
          (nextState.counters[counterName] ?? 0) + value
        nextTracking.mutations.increments[counterName] =
          (nextTracking.mutations.increments[counterName] ?? 0) + value
        break
      }
    }

    let nextIds: number[] = []

    switch (node.type) {
      case NodeType.CheckBoolean: {
        nextTracking.checks.booleans.add(node.Content)
        const condition = !!nextState.booleans[node.Content]
        nextIds = condition ? node.TrueNodes : node.FalseNodes
        break
      }
      case NodeType.CheckBooleanScript: {
        // TODO: Implement script evaluation logic and tracking
        nextIds = Array.from(new Set([...node.TrueNodes, ...node.FalseNodes]))
        break
      }
      case NodeType.CheckCounter: {
        nextTracking.checks.counters.add(node.CounterName)
        const matchingIds = new Set<number>()
        let metAny = false

        // Evaluate only conditional nodes first
        for (const output of node.Outputs) {
          if (
            output.Expression !== 'false' &&
            output.CompareOperators.length > 0
          ) {
            const resultIds = this.evaluateCounterOutput(
              output,
              nextState.counters[node.CounterName]
            )
            if (resultIds.length > 0) {
              metAny = true
              resultIds.forEach((id) => matchingIds.add(id))
            }
          }
        }

        // If no conditional nodes matched, take the fallback "false" path
        if (!metAny) {
          const fallback = node.Outputs.find((o) => o.Expression === 'false')
          if (fallback) fallback.Outgoing.forEach((id) => matchingIds.add(id))
        }
        nextIds = Array.from(matchingIds)
        break
      }
      case NodeType.CheckMultiBoolean: {
        const matchingIds = new Set<number>()
        let metAny = false

        // Evaluate only conditional nodes first
        for (const output of node.Outputs) {
          if (output.Expression !== 'false') {
            const { outgoing: resultIds, booleans } =
              this.evaluateBooleanOutput(output, nextState.booleans)
            if (booleans) {
              booleans.forEach((bool) => nextTracking.checks.booleans.add(bool))
            }
            if (resultIds.length > 0) {
              metAny = true
              resultIds.forEach((id) => matchingIds.add(id))
            }
          }
        }

        // If no conditional nodes matched, take the fallback "false" path
        if (!metAny) {
          const fallback = node.Outputs.find((o) => o.Expression === 'false')
          if (fallback) fallback.Outgoing.forEach((id) => matchingIds.add(id))
        }
        nextIds = Array.from(matchingIds)
        break
      }
      case NodeType.End:
        nextIds = []
        break
      default:
        if ('Outgoing' in node) nextIds = node.Outgoing
        break
    }

    if (nextIds.length === 0) {
      results.push(
        this.finalizePath(newPath, nextState, pathUncertain, nextTracking)
      )
      return
    }

    nextIds.forEach((id) => {
      const nextNode = this.chat.getById(id)
      if (nextNode) {
        this.traverse(
          nextNode,
          nextState,
          newPath,
          results,
          newVisited,
          pathUncertain,
          nextTracking
        )
      }
    })
  }

  /**
   * Helper to parse the counter name and increment value from an IncCounterDialogueNode's Content string.
   * The Content is expected to be in the format "counterName incrementValue", e.g. "Thermostat 1" or "Thermostat -2".
   * @param node The IncCounterDialogueNode to parse
   * @returns An object containing the counter name and the increment value
   * @throws An error if the Content format is invalid
   */
  private getCounter(node: IncCounterDialogueNode) {
    const [counterName, value] = node.Content.split(' ')
    if (!counterName || isNaN(Number(value))) {
      throw new UnsupportedOperation(
        `Invalid counter content format for node ${node.Id}: ${node.Content}`
      )
    }
    return { counterName, value: Number(value) }
  }

  /**
   * Evaluate a counter output condition against the current counter value,
   * supporting multiple comparisons combined with logical operators.
   * Note: If the output expression is "false", this function returns the outgoing nodes without evaluating any conditions,
   * as "false" outputs are used as fallbacks when no other conditions are met.
   * For non-"false" expressions, all conditions must be met according to their logical operators for the outgoing nodes to be returned.
   * @param output The Output object containing the condition to evaluate
   * @param counterValue The current value of the counter being checked
   * @returns An array of outgoing node IDs if the condition is met, or an empty array if not met
   * @throws An error if an unknown comparison or logical operator is encountered
   */
  private evaluateCounterOutput(output: Output, counterValue?: number) {
    if (output.Expression === 'false') {
      return output.Outgoing
    }

    const counter = counterValue ?? 0

    const comparisonResults = output.CompareOperators.map((op, index) => {
      const targetValue = output.Values[index]

      if (!targetValue) return false

      switch (op) {
        case 0:
          return counter < targetValue
        case 1:
          return counter <= targetValue
        case 2:
          return counter === targetValue
        case 3:
          return counter > targetValue
        case 4:
          return counter >= targetValue
        default:
          throw new UnsupportedOperation(
            `Unknown comparison operator ${op} in output ${output.Expression}`
          )
      }
    })

    let match = comparisonResults[0]

    for (let index = 0; index < output.LogicalOperators.length; index++) {
      const nextResult = comparisonResults[index + 1]
      const logicalOp = output.LogicalOperators[index]

      if (logicalOp === 0)
        match = match && nextResult // AND
      else
        throw new UnsupportedOperation(
          `Unknown logical operator ${logicalOp} in output ${output.Expression}`
        )
    }

    return match ? output.Outgoing : []
  }

  /**
   * Evaluate a boolean output condition against the current boolean values.
   * Similar to evaluateCounterOutput, but for boolean conditions.
   * If the output expression is "false", it returns the outgoing nodes as a fallback.
   * For non-"false" expressions, it checks if the specified boolean is true in the current state to determine which nodes to return.
   * @param output The Output object containing the boolean condition to evaluate
   * @param booleans The current record of boolean values in the simulation state
   * @returns An array of outgoing node IDs if the condition is met, or an empty array if not met
   */
  private evaluateBooleanOutput(
    output: Output,
    booleans: Record<string, boolean>
  ) {
    if (output.Expression === 'false') {
      return { outgoing: output.Outgoing, booleans: null }
    }

    const booleansFromExpression = output.Expression.split(',').map((bool) =>
      bool.trim()
    )

    if (booleansFromExpression.every((bool) => booleans?.[bool] ?? false)) {
      return { outgoing: output.Outgoing, booleans: booleansFromExpression }
    }

    return { outgoing: [], booleans: booleansFromExpression }
  }

  /**
   * Helper to convert internal Sets back to arrays for the result object
   */
  private finalizePath(
    nodes: Node[],
    state: SimulationState,
    uncertain: boolean,
    tracking: SimulationTracking
  ): DialoguePath {
    return {
      nodes,
      finalState: state,
      isUncertain: uncertain,
      checks: {
        booleans: Array.from(tracking.checks.booleans),
        counters: Array.from(tracking.checks.counters),
      },
      mutations: {
        chemistry: tracking.mutations.chemistry || 0,
        set: Array.from(tracking.mutations.set),
        reset: Array.from(tracking.mutations.reset),
        increments: tracking.mutations.increments,
      },
    }
  }

  private getStartNodeOrThrow(startNode: StartDialogueNode | number) {
    if (typeof startNode === 'number') {
      const foundNode = this.chat.getById(startNode)
      if (foundNode?.type !== NodeType.Start) {
        throw new NodeInvalidType(
          `Node with id ${startNode} is not a start node.`
        )
      }
      return foundNode
    } else if (!this.chat.getById(startNode.Id)) {
      throw new NodeNotFound(`Node with id ${startNode.Id} not found.`)
    } else {
      return startNode
    }
  }

  /**
   * Evaluates logic nodes based on current state to find which paths are open.
   */
  private getImmediateNextIds(node: Node): number[] {
    const isInitialStateSet = !!this.options?.initialState
    const state = this.options?.initialState ?? { booleans: {}, counters: {} }
    switch (node.type) {
      case NodeType.CheckBoolean:
        if (!isInitialStateSet) {
          return [...node.TrueNodes, ...node.FalseNodes]
        }
        return state.booleans?.[node.Content] ? node.TrueNodes : node.FalseNodes

      case NodeType.CheckCounter: {
        const matchingIds = new Set<number>()
        let metAny = false

        for (const out of node.Outputs) {
          const ids = this.evaluateCounterOutput(
            out,
            state.counters[node.CounterName]
          )
          if (ids.length > 0) {
            metAny = true
            ids.forEach((id) => matchingIds.add(id))
          }
        }

        if (!metAny) {
          const fallback = node.Outputs.find((o) => o.Expression === 'false')
          if (fallback) fallback.Outgoing.forEach((id) => matchingIds.add(id))
        }
        return Array.from(matchingIds)
      }

      case NodeType.CheckMultiBoolean: {
        const matchingIds = new Set<number>()
        let metAny = false

        for (const out of node.Outputs) {
          const { outgoing: ids } = this.evaluateBooleanOutput(
            out,
            state.booleans
          )
          if (ids.length > 0) {
            metAny = true
            ids.forEach((id) => matchingIds.add(id))
          }
        }

        if (!metAny) {
          const fallback = node.Outputs.find((o) => o.Expression === 'false')
          if (fallback) fallback.Outgoing.forEach((id) => matchingIds.add(id))
        }
        return Array.from(matchingIds)
      }

      case NodeType.CheckBooleanScript:
        // Explore all possible logic branches due to unknown script result
        return [...new Set([...node.TrueNodes, ...node.FalseNodes])]

      case NodeType.End:
        return []

      default:
        // For Chemistry | IncCounter | ResetBoolean | SetBoolean | SpecialCompletion | Start.
        return 'Outgoing' in node ? node.Outgoing : []
    }
  }
}
