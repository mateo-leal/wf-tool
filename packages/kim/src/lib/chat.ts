import {
  Dictionary,
  SUPPORTED_LANGUAGES,
} from '@tenno-companion/shared/locales'
import { Chatroom, Node, NodeType } from '../types'
import { HydratedDataOptions } from '../types/internal'

export class Chat {
  private constructor(readonly nodes: Node[]) {}

  static async create(chatroom: Chatroom, options: HydratedDataOptions = {}) {
    const chats = await this.getHydratedData(chatroom, options)
    return new this(chats)
  }

  /**
   * Static helper used by subclasses to fetch and translate data
   */
  private static async getHydratedData(
    chatroom: Chatroom,
    { locale }: HydratedDataOptions = {}
  ) {
    const validLocale =
      locale && Object.keys(SUPPORTED_LANGUAGES).includes(locale)
        ? locale
        : 'en'

    const [rawStats, dict] = await Promise.all([
      import(`../../data/chats/${chatroom}.json`).then(
        (m) => m.default as Node[]
      ),
      import(`../../data/dicts/${validLocale}.json`).then(
        (m) => m.default as Dictionary
      ),
    ])

    return rawStats.map((rawData) => {
      return this.translateRecursive(rawData, dict) as Node
    })
  }

  /**
   * Recursively scans an object/array and replaces the value of 'LocTag'.
   */
  private static translateRecursive(data: unknown, dict: Dictionary): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.translateRecursive(item, dict))
    }

    if (data !== null && typeof data === 'object') {
      const result: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(data)) {
        if (key === 'LocTag' && typeof value === 'string') {
          result[key] = dict[value] ?? value
        } else {
          result[key] = this.translateRecursive(value, dict)
        }
      }
      return result
    }

    return data
  }

  filter<S extends Node>(predicate: (item: Node) => item is S): S[]
  filter(predicate: (item: Node) => boolean): Node[] {
    const results: Node[] = []
    for (const chat of Object.values(this.nodes)) {
      if (predicate(chat)) results.push(chat)
    }
    return results
  }

  getById(id: number) {
    return this.nodes.find((chat) => chat.Id === id)
  }

  get startNodes() {
    return this.nodes.filter((node) => node.type === NodeType.Start)
  }
}
