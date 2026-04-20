export type EmojiContentPart =
  | {
      kind: 'text'
      value: string
    }
  | {
      kind: 'image'
      token: string
      src: string
      alt: string
    }

/**
 * Maps <RETRO_*> tokens found in dialogue content to rendered replacements.
 * Add or edit entries as new tokens are discovered.
 */
export const EMOJI_TOKEN_MAP: Record<string, string> = {
  RETRO_EMOJI_HEART: '<3',
  RETRO_EMOJI_AOICAT: '=^･^=',
}

const TOKEN_RE = /<([A-Z0-9_]+)>/g
const RETRO_EMOJI_PREFIX = 'RETRO_EMOJI_'

function fallbackRetroEmojiImage(name: string): EmojiContentPart | null {
  if (!name.startsWith(RETRO_EMOJI_PREFIX)) {
    return null
  }

  const suffix = name
    .slice(RETRO_EMOJI_PREFIX.length)
    .toLowerCase()
    .split('_')
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => chunk[0]?.toUpperCase() + chunk.slice(1))
    .join('')

  if (!suffix) {
    return null
  }

  return {
    kind: 'image',
    token: name,
    src: `https://browse.wf/Lotus/Interface/Graphics/Retro/Texts/Emoji/RetroEmoji${suffix}_d.png`,
    alt: `${suffix} emoji`,
  }
}

/**
 * Tokenizes a chat content string into renderable text/image parts.
 * Unknown <TOKEN_NAME> sequences are preserved as plain text.
 */
export function parseEmojiContent(text: string): EmojiContentPart[] {
  const parts: EmojiContentPart[] = []
  let cursor = 0

  for (const match of text.matchAll(TOKEN_RE)) {
    const fullMatch = match[0]
    const name = match[1]
    const start = match.index ?? -1
    if (start < 0) continue

    if (start > cursor) {
      parts.push({
        kind: 'text',
        value: text.slice(cursor, start),
      })
    }

    const replacement = EMOJI_TOKEN_MAP[name]
    if (typeof replacement === 'string') {
      parts.push({ kind: 'text', value: replacement })
    } else {
      const fallbackImage = fallbackRetroEmojiImage(name)
      if (fallbackImage) {
        parts.push(fallbackImage)
      } else {
        parts.push({ kind: 'text', value: fullMatch })
      }
    }

    cursor = start + fullMatch.length
  }

  if (cursor < text.length) {
    parts.push({ kind: 'text', value: text.slice(cursor) })
  }

  return parts.length > 0 ? parts : [{ kind: 'text', value: text }]
}
