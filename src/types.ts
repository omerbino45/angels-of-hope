export interface Fallen {
  name: string
  city: string
  /** D.M.YY or D.M.YYYY */
  date: string
  /** The person's own page on izkor.gov.il */
  izkor?: string
  bio?: string
  photo?: string
}

export interface Family {
  id: string
  name: string
  /** Usually one person; brothers who fell are listed together under one family. */
  fallen: Fallen[]
  acceptsLetters: boolean
}

export interface StickerRef {
  src: string
  /** A small copy for the gallery, so switching categories stays fast. */
  thumb?: string
  he: string
  en: string
  flag?: boolean
  emblem?: boolean
}

export interface SongData {
  url: string
  /** A Spotify Code, or a QR when Spotify couldn't provide one. */
  code?: string
  qr?: string
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
  | (ItemBase & { type: 'sticker'; sticker: StickerRef; /** Degrees clockwise. */ rotation?: number })
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
  /** The letter text's font weight; regular when unset. */
  weight?: number
  size: number
  ink?: string
  /** A soft panel behind the text, for backgrounds that make it hard to read. */
  textPanel?: boolean
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
