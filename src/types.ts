export interface Family {
  id: string
  name: string
  fallen: string
  city: string
  date: string
  bio?: string
  photo?: string
  acceptsLetters: boolean
}

export interface StickerRef {
  src: string
  he: string
  en: string
  flag?: boolean
  emblem?: boolean
}

export interface SongData {
  url: string
  qr: string
  title?: string
  cover?: string
  lines: string
}

interface ItemBase {
  id: string
  /** x, y and w are fractions of the paper's width, so a letter scales with its page. */
  x: number
  y: number
  w: number
}

export type LetterItem =
  | (ItemBase & { type: 'sticker'; sticker: StickerRef })
  | (ItemBase & { type: 'image'; src: string; ratio: number })
  | (ItemBase & { type: 'song'; song: SongData })

export interface Stroke {
  id: string
  color: string
  width: number
  /** SVG points in a 1000-unit-wide coordinate space. */
  points: string
}

export interface LetterDesign {
  themeId: string
  bgId: string
  fontId: string
  size: number
  ink?: string
  /** Base text size as a fraction of paper width: larger on phones, where the paper is narrow. */
  baseRatio: number
  items: LetterItem[]
  strokes: Stroke[]
}

export type LetterStatus = 'new' | 'printed' | 'delivered'

export interface Letter {
  id: string
  familyId: string
  greeting: string
  text: string
  design: LetterDesign
  writer: string
  email: string
  phone: string
  isPublic: boolean
  signature: string
  status: LetterStatus
  createdAt: number
  sample?: boolean
}
