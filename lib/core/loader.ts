import { readFile } from 'node:fs/promises'
import { DialoguePayload, DialogueNode } from '../types'
import { DEFAULT_LANGUAGE, getDictionarySource } from '../language'

export const DEFAULT_DICT_SOURCE = getDictionarySource(DEFAULT_LANGUAGE)

export async function loadText(source: string): Promise<string> {
  return source.startsWith('http://') || source.startsWith('https://')
    ? await (await fetch(source)).text()
    : await readFile(source, 'utf8')
}

export async function loadNodes(source: string): Promise<DialogueNode[]> {
  const raw = await loadText(source)
  const parsed = JSON.parse(raw) as DialoguePayload

  if (Array.isArray(parsed)) {
    return parsed
  }

  if (Array.isArray(parsed.Nodes)) {
    return parsed.Nodes
  }

  if (Array.isArray(parsed.nodes)) {
    return parsed.nodes
  }

  throw new Error(
    'Unsupported payload shape. Expected an array or object with Nodes/nodes array.'
  )
}

export async function loadDictionary(
  source: string
): Promise<Map<string, string>> {
  const raw = await loadText(source)
  const parsed = JSON.parse(raw) as Record<string, unknown>
  const map = new Map<string, string>()

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      map.set(key, value)
    }
  }

  return map
}
