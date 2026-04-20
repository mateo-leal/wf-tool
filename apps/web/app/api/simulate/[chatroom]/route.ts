import { Chatroom, SimulationState } from '@tenno-companion/kim/types'
import { NextRequest } from 'next/server'
import { Chat } from '@tenno-companion/kim/server'
import { PathSelector, Simulation } from '@tenno-companion/kim'
import { CHATROOMS, NodeType } from '@tenno-companion/kim/constants'

const chatCache = new Map<string, Chat>()
// const simulationCache = new Map<string, any>()

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/simulate/[chatroom]'>
) {
  const { chatroom } = await ctx.params

  if (!(CHATROOMS as readonly string[]).includes(chatroom)) {
    return Response.json(
      { message: 'Must be a valid chatroom' },
      { status: 400 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const locale = searchParams.get('locale') || 'en'
  const stateText = searchParams.get('state')
  const startNodeId = searchParams.get('startNodeId')

  let options: SimulationState = { booleans: {}, counters: {} }

  if (!startNodeId || isNaN(Number(startNodeId))) {
    return Response.json(
      { message: 'startNodeId must be a number' },
      { status: 400 }
    )
  }

  if (stateText) {
    try {
      options = JSON.parse(stateText)
    } catch {
      return Response.json({ message: 'state is not valid' }, { status: 400 })
    }
  }

  // Generate a unique Cache Key for this exact scenario
  // We use the stateText string directly to ensure exact match
  // const cacheKey = `${chatroom}:${locale}:${startNodeId}:${stateText}`

  // if (simulationCache.has(cacheKey)) {
  //   return Response.json(simulationCache.get(cacheKey), {
  //     headers: { 'X-Cache': 'HIT' },
  //   })
  // }

  try {
    const chatKey = `${chatroom}:${locale}`
    let chat = chatCache.get(chatKey)
    if (!chat) {
      chat = await Chat.create(chatroom as Chatroom, { locale })
      chatCache.set(chatKey, chat)
    }

    const startNode = chat.getById(Number(startNodeId))

    if (!startNode) {
      return Response.json({
        message: `Node with id ${startNodeId} not found.`,
      })
    }

    if (startNode.type !== NodeType.Start) {
      return Response.json({
        message: `Node with id ${startNode} is not a start node.`,
      })
    }

    const simulation = new Simulation(chat, { initialState: options })

    const paths = simulation.getPaths(startNode)
    const checks = PathSelector.getChecks(paths)
    const optimizedResults = PathSelector.selectBestPaths(paths)

    // const sanitizedResults = Object.entries(optimizedResults).map(
    //   ([key, paths]) => ({
    //     [key]: paths.map(cleanResults),
    //   })
    // )

    const responseData = { checks, optimizedResults }

    // simulationCache.set(cacheKey, responseData)

    // if (simulationCache.size > 200) {
    //   const firstKey = simulationCache.keys().next().value
    //   if (firstKey) {
    //     simulationCache.delete(firstKey)
    //   }
    // }

    return Response.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    })
  } catch (error) {
    return Response.json({ message: error }, { status: 400 })
  }
}

// function cleanResults(path: DialoguePath) {
//   const { finalState, nodes, ...cleanPath } = path
//   const cleanNodes = path.nodes.map((node) => {
//     // Create a shallow copy of the node
//     const {
//       GraphPos, // Extract and ignore
//       // @ts-expect-error - property is not included in every node type
//       Incoming, // Extract and ignore
//       // @ts-expect-error - property is not included in every node type
//       Outgoing, // Extract and ignore
//       // @ts-expect-error - property is not included in every node type
//       TrueNodes,
//       // @ts-expect-error - property is not included in every node type
//       FalseNodes,
//       // @ts-expect-error - property is not included in every node type
//       Script,
//       // @ts-expect-error - property is not included in every node type
//       Outputs,
//       // @ts-expect-error - property is not included in every node type
//       Delay,
//       // @ts-expect-error - property is not included in every node type
//       Transmission,
//       ...cleanNode // Collect everything else
//     } = node

//     return cleanNode
//   })
//   return {
//     ...cleanPath,
//     nodes: cleanNodes,
//   }
// }
