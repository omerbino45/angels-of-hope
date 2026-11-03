import type { StickerRef } from '../types'

export interface Theme {
  id: string
  he: string
  en: string
  paper: string
  ink: string
  accent: string
}

export const themes: Theme[] = [
  { id: 'hope', he: 'כחול תקווה', en: 'Hope blue', paper: '#fbf8f1', ink: '#0f2d5e', accent: '#2563a8' },
  { id: 'gold', he: 'זהב חם', en: 'Warm gold', paper: '#f7efdc', ink: '#4a3a17', accent: '#c9a84c' },
  { id: 'white', he: 'לבן נקי', en: 'Clean white', paper: '#ffffff', ink: '#0d1f3c', accent: '#4a89c8' },
  { id: 'sage', he: 'ירוק זית', en: 'Sage', paper: '#eef3ea', ink: '#2d4a35', accent: '#6b8f71' },
  { id: 'blush', he: 'ורוד עדין', en: 'Blush', paper: '#fbeff0', ink: '#5b2a3a', accent: '#c97b8e' },
  { id: 'dusk', he: 'כחול לילה', en: 'Night blue', paper: '#0f2d5e', ink: '#f5f0e8', accent: '#c9a84c' },
]

/** The free-drawing page: picking it clears the background and opens the pen, mainly for children. */
export const blankTheme: Theme = { id: 'blank', he: 'דף לציור', en: 'Drawing page', paper: '#ffffff', ink: '#0d1f3c', accent: '#4a89c8' }

export const allThemes = [...themes, blankTheme]

export const backgrounds = [
  { id: 'plain', he: 'חלק', en: 'Plain' },
  { id: 'lines', he: 'שורות', en: 'Lined' },
  { id: 'frame', he: 'מסגרת', en: 'Frame' },
  { id: 'waves', he: 'גלים', en: 'Waves' },
  { id: 'stars', he: 'מגני דוד', en: 'Stars' },
  { id: 'hearts', he: 'לבבות', en: 'Hearts' },
  { id: 'flag', he: 'דגל ישראל', en: 'Israeli flag' },
]

export const fonts = [
  { id: 'heebo', he: 'היבו', en: 'Heebo', family: "'Heebo', sans-serif", scale: 1 },
  { id: 'frank', he: 'פרנק רוהל', en: 'Frank Ruhl', family: "'Frank Ruhl Libre', serif", scale: 1 },
  { id: 'david', he: 'דוד', en: 'David', family: "'David Libre', serif", scale: 1.05 },
  { id: 'varela', he: 'וארלה עגול', en: 'Varela Round', family: "'Varela Round', sans-serif", scale: 1 },
  { id: 'amatic', he: 'כתב יד', en: 'Handwriting', family: "'Amatic SC', cursive", scale: 1.4 },
]

export const sizes = [
  { value: 0.85, he: 'קטן', en: 'Small' },
  { value: 1, he: 'רגיל', en: 'Medium' },
  { value: 1.2, he: 'גדול', en: 'Large' },
]

const emoji = (values: string[]): StickerRef[] => values.map((value) => ({ kind: 'emoji', value }))

// Unit flags are generic colored pennants, not the official insignia.
const unit = (label: string, a: string, b: string): StickerRef => ({ kind: 'unit', label, colors: [a, b] })

export const stickerCategories: { id: string; he: string; en: string; stickers: StickerRef[] }[] = [
  { id: 'love', he: 'לבבות ואהבה', en: 'Hearts & love', stickers: emoji(['💙', '🤍', '❤️', '💛', '💕', '💖', '🫶', '🥰']) },
  { id: 'israel', he: 'מדינת ישראל', en: 'Israel', stickers: [{ kind: 'israel' }, ...emoji(['✡️', '🕊️', '🌾', '🌻', '🇮🇱'])] },
  { id: 'memory', he: 'זיכרון', en: 'Remembrance', stickers: emoji(['🕯️', '🌹', '🌷', '🌿', '⭐', '🌟', '☀️', '🌈']) },
  {
    id: 'units',
    he: 'דגלי יחידות',
    en: 'Unit flags',
    stickers: [
      unit('גולני', '#6b4a1f', '#e0b83a'),
      unit('גבעתי', '#5b2a86', '#ffffff'),
      unit('צנחנים', '#a32430', '#ffffff'),
      unit('נח"ל', '#2f7a3f', '#ffffff'),
      unit('כפיר', '#3c5a2c', '#e8dcc8'),
      unit('שריון', '#20242b', '#c9a84c'),
      unit('הנדסה', '#b34a1d', '#ffffff'),
      unit('תותחנים', '#23519b', '#e43d30'),
    ],
  },
  { id: 'people', he: 'אנשים וחיבוק', en: 'People & hugs', stickers: emoji(['🤗', '🫂', '🙏', '🤝', '😊', '👨‍👩‍👧‍👦', '👐', '✍️']) },
]

export const penColors = ['#0f2d5e', '#2563a8', '#c9a84c', '#c0392b', '#2f7a3f', '#0d0d0d', '#ffffff']
export const penWidths = [3, 6, 12]

export function writingPrompts(fallen: string | null) {
  const name = fallen ?? 'הגיבורים'
  const nameEn = fallen ?? 'the heroes'
  return [
    { he: 'קוראים לי ___, ורציתי שתדעו ש...', en: 'My name is ___, and I wanted you to know that...' },
    { he: `כששמעתי על ${name}, הדבר שהכי נגע בי היה...`, en: `When I heard about ${nameEn}, what touched me most was...` },
    { he: 'אני חושב/ת עליכם בימים האלה, כי...', en: 'I think of you these days, because...' },
    { he: 'אני רוצה להגיד לכם תודה על...', en: 'I want to thank you for...' },
    { he: 'מה שאני לוקח/ת איתי מהסיפור הזה הוא...', en: 'What I take with me from this story is...' },
    { he: 'אתם לא לבד. אנחנו זוכרים.', en: 'You are not alone. We remember.' },
  ]
}
