import { EMOJI_TOKEN_MAP, parseEmojiContent } from '../emoji-tokens'

describe('emoji tokens', () => {
  it('should replace known text token with text part', () => {
    const parts = parseEmojiContent('Hi <RETRO_EMOJI_HEART>')
    expect(parts).toEqual([
      { kind: 'text', value: 'Hi ' },
      {
        kind: 'text',
        value: EMOJI_TOKEN_MAP['RETRO_EMOJI_HEART'],
      },
    ])
  })

  it('should keep known text token as text part', () => {
    const parts = parseEmojiContent('Look <RETRO_EMOJI_AOICAT> now')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toEqual({ kind: 'text', value: 'Look ' })
    expect(parts[1]).toEqual({
      kind: 'text',
      value: EMOJI_TOKEN_MAP['RETRO_EMOJI_AOICAT'],
    })
    expect(parts[2]).toEqual({ kind: 'text', value: ' now' })
  })

  it('should fallback unknown RETRO_EMOJI token to image URL', () => {
    const parts = parseEmojiContent('Unknown <RETRO_EMOJI_MISSING> token')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toEqual({ kind: 'text', value: 'Unknown ' })
    expect(parts[1]).toMatchObject({
      kind: 'image',
      token: 'RETRO_EMOJI_MISSING',
      src: 'https://browse.wf/Lotus/Interface/Graphics/Retro/Texts/Emoji/RetroEmojiMissing_d.png',
    })
    expect(parts[2]).toEqual({ kind: 'text', value: ' token' })
  })

  it('should keep non-retro unknown token as text', () => {
    const parts = parseEmojiContent('Token <SOME_UNKNOWN_TOKEN> here')
    expect(parts).toEqual([
      { kind: 'text', value: 'Token ' },
      { kind: 'text', value: '<SOME_UNKNOWN_TOKEN>' },
      { kind: 'text', value: ' here' },
    ])
  })
})
