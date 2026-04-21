import { Chatroom } from '../src/types'

export const SOURCES: Record<Chatroom, string> = {
  aoi: 'AoiDialogue_rom.dialogue',
  arthur: 'ArthurDialogue_rom.dialogue',
  eleanor: 'EleanorDialogue_rom.dialogue',
  flare: 'FlareDialogue_rom.dialogue',
  hex: 'HexDialogue_rom.dialogue',
  amir: 'JabirDialogue_rom.dialogue',
  kaya: 'KayaDialogue_rom.dialogue',
  lettie: 'LettieDialogue_rom.dialogue',
  loid: 'LoidDialogue_rom.dialogue',
  lyon: 'LyonDialogue_rom.dialogue',
  marie: 'MarieDialogue_rom.dialogue',
  minerva: 'MinervaDialogue_rom.dialogue',
  'minerva-velimir': 'MinervaVelemirDialogue_rom.dialogue',
  quincy: 'QuincyDialogue_rom.dialogue',
  roathe: 'RoatheDialogue_rom.dialogue',
  velimir: 'VelimirDialogue_rom.dialogue',
}

export const OWNER = 'Sainan'
export const REPO = 'warframe-kim-dialogues'
export const BRANCH = 'senpai'

export const BASE_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/refs/heads/${BRANCH}/`
