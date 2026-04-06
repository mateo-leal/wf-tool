import { readFile } from 'node:fs/promises'
import { DialogueNode } from '../types'

export async function loadText(source: string): Promise<string> {
  return source.startsWith('http://') || source.startsWith('https://')
    ? await (await fetch(source)).text()
    : await readFile(source, 'utf8')
}

export async function loadNodes(source: string): Promise<DialogueNode[]> {
  const raw = await loadText(source)
  const parsed = JSON.parse(raw) as DialogueNode[]

  const localized = parsed.map((node) => ({
    ...node,
    Content: node.LocTag ?? node.Content ?? undefined,
  }))

  return localized
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
