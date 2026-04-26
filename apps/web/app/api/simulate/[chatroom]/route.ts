import { metrics } from '@sentry/nextjs'
import { NextRequest } from 'next/server'
import { Chat } from '@tenno-companion/kim/server'
import { PathSelector, Simulation } from '@tenno-companion/kim'
import { CHATROOMS, NodeType } from '@tenno-companion/kim/constants'
import { Chatroom, SimulationState } from '@tenno-companion/kim/types'

const chatCache = new Map<string, Chat>()

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/simulate/[chatroom]'>
) {
  const start = Date.now()
  const { chatroom } = await ctx.params

  try {
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

    const responseData = { checks, optimizedResults }

    metrics.count('chats_simulated', 1, {
      attributes: { status: 'success', chatroom },
    })

    return Response.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    })
  } catch (error) {
    metrics.count('chats_simulated', 1, {
      attributes: { status: 'failed', chatroom },
    })
    return Response.json(
      { message: error instanceof Error ? error.message : undefined },
      { status: 500 }
    )
  } finally {
    metrics.distribution('simulation_latency', Date.now() - start, {
      unit: 'millisecond',
    })
  }
}
